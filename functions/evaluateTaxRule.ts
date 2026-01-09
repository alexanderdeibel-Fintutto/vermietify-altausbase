import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { rule_codes, category_code, tax_year, reference_date, context } = await req.json();
    
    // Load matching rules
    let rulesQuery = await base44.entities.TaxRule.filter({
      is_active: true
    });
    
    let rules = [];
    for (const rule of rulesQuery) {
      if (rule.valid_from_tax_year <= tax_year && (!rule.valid_to_tax_year || rule.valid_to_tax_year >= tax_year)) {
        rules.push(rule);
      }
    }
    
    if (category_code) {
      const category = (await base44.entities.TaxRuleCategory.filter({ 
        category_code 
      }))[0];
      if (category) {
        rules = rules.filter(r => r.category_id === category.id);
      }
    }
    
    if (rule_codes && rule_codes.length > 0) {
      rules = rules.filter(r => rule_codes.includes(r.rule_code));
    }
    
    rules.sort((a, b) => (b.priority || 100) - (a.priority || 100));
    
    // Load matching configs
    const allConfigs = await base44.entities.TaxConfig.filter({
      is_active: true
    });
    
    const configMap = {};
    for (const config of allConfigs) {
      const isValidYear = (!config.valid_to_tax_year || config.valid_to_tax_year >= tax_year);
      const isValidDate = !reference_date || (
        (!config.valid_from_date || new Date(config.valid_from_date) <= new Date(reference_date)) &&
        (!config.valid_to_date || new Date(config.valid_to_date) >= new Date(reference_date))
      );
      
      if (isValidYear && isValidDate) {
        if (!configMap[config.config_key] || 
            config.valid_from_tax_year > configMap[config.config_key].valid_from_tax_year) {
          configMap[config.config_key] = config;
        }
      }
    }
    
    // Evaluate rules
    const results = [];
    const appliedRules = [];
    const warnings = [];
    const errors = [];
    
    const enrichedContext = { ...context };
    for (const [key, config] of Object.entries(configMap)) {
      enrichedContext[`CONFIG_${key}`] = parseConfigValue(config.value, config.value_type);
    }
    
    for (const rule of rules) {
      try {
        const isValidYear = (!rule.valid_to_tax_year || rule.valid_to_tax_year >= tax_year);
        const isValidDate = !reference_date || (
          (!rule.valid_from_date || new Date(rule.valid_from_date) <= new Date(reference_date)) &&
          (!rule.valid_to_date || new Date(rule.valid_to_date) >= new Date(reference_date))
        );
        
        if (!isValidYear || !isValidDate) continue;
        
        const conditionsMet = evaluateConditions(rule.conditions || {}, enrichedContext);
        
        if (conditionsMet) {
          const result = executeActions(rule.actions || {}, enrichedContext);
          
          results.push({
            rule_code: rule.rule_code,
            rule_name: rule.display_name,
            rule_type: rule.rule_type,
            result: result,
            legal_reference: rule.legal_reference
          });
          
          appliedRules.push(rule.rule_code);
          
          if (result && typeof result === 'object') {
            Object.assign(enrichedContext, result);
          }
        }
      } catch (ruleError) {
        errors.push(`Rule ${rule.rule_code}: ${ruleError.message}`);
      }
    }
    
    return Response.json({
      success: true,
      tax_year,
      reference_date,
      results,
      applied_rules: appliedRules,
      config_values: Object.fromEntries(
        Object.entries(configMap).map(([k, v]) => [k, parseConfigValue(v.value, v.value_type)])
      ),
      warnings,
      errors
    });
    
  } catch (error) {
    console.error('Error evaluating tax rules:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

function parseConfigValue(value, valueType) {
  switch (valueType) {
    case 'PERCENTAGE':
    case 'DECIMAL':
      return parseFloat(value);
    case 'CURRENCY':
    case 'INTEGER':
      return parseInt(value, 10);
    case 'BOOLEAN':
      return value === 'true' || value === '1';
    case 'DATE':
      return new Date(value);
    default:
      return value;
  }
}

function evaluateConditions(conditions, context) {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  
  for (const [field, condition] of Object.entries(conditions)) {
    const value = context[field];
    
    if (typeof condition === 'object') {
      if (condition.$eq !== undefined && value !== condition.$eq) return false;
      if (condition.$ne !== undefined && value === condition.$ne) return false;
      if (condition.$gt !== undefined && !(value > condition.$gt)) return false;
      if (condition.$gte !== undefined && !(value >= condition.$gte)) return false;
      if (condition.$lt !== undefined && !(value < condition.$lt)) return false;
      if (condition.$lte !== undefined && !(value <= condition.$lte)) return false;
      if (condition.$in !== undefined && !condition.$in.includes(value)) return false;
      if (condition.$nin !== undefined && condition.$nin.includes(value)) return false;
      if (condition.$exists !== undefined && (value !== undefined) !== condition.$exists) return false;
      if (condition.$between !== undefined) {
        const [min, max] = condition.$between;
        if (!(value >= min && value <= max)) return false;
      }
    } else {
      if (value !== condition) return false;
    }
  }
  
  return true;
}

function executeActions(actions, context) {
  const result = {};
  
  for (const [key, action] of Object.entries(actions)) {
    if (typeof action === 'object' && action.$formula) {
      result[key] = evaluateFormula(action.$formula, context);
    } else if (typeof action === 'object' && action.$lookup) {
      result[key] = context[action.$lookup];
    } else if (typeof action === 'object' && action.$conditional) {
      const { if: condExpr, then: thenVal, else: elseVal } = action.$conditional;
      result[key] = evaluateConditions(condExpr, context) ? 
        (typeof thenVal === 'object' ? executeActions({ v: thenVal }, context).v : thenVal) :
        (typeof elseVal === 'object' ? executeActions({ v: elseVal }, context).v : elseVal);
    } else {
      result[key] = action;
    }
  }
  
  return result;
}

function evaluateFormula(formula, context) {
  let expr = formula;
  
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'number') {
      expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
    }
  }
  
  try {
    expr = expr.replace(/min\(([^,]+),([^)]+)\)/g, (_, a, b) => 
      Math.min(parseFloat(a), parseFloat(b)).toString()
    );
    expr = expr.replace(/max\(([^,]+),([^)]+)\)/g, (_, a, b) => 
      Math.max(parseFloat(a), parseFloat(b)).toString()
    );
    expr = expr.replace(/round\(([^,]+),?(\d*)\)/g, (_, num, dec) => {
      const d = dec ? parseInt(dec) : 0;
      return (Math.round(parseFloat(num) * Math.pow(10, d)) / Math.pow(10, d)).toString();
    });
    
    const safeEval = new Function('return ' + expr);
    return safeEval();
  } catch (e) {
    console.error('Formula evaluation error:', formula, e);
    return null;
  }
}