import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const { 
      tax_law_update_id, 
      approved_config_indices,
      approved_rule_indices,
      review_notes 
    } = await req.json();
    
    const taxLawUpdate = await base44.entities.TaxLawUpdate.get(tax_law_update_id);
    if (!taxLawUpdate) {
      return Response.json({ error: 'TaxLawUpdate not found' }, { status: 404 });
    }
    
    const implementedConfigs = [];
    const implementedRules = [];
    const errors = [];
    
    // Apply config suggestions
    if (approved_config_indices && taxLawUpdate.suggested_config_changes) {
      for (const index of approved_config_indices) {
        const suggestion = taxLawUpdate.suggested_config_changes[index];
        if (!suggestion) continue;
        
        try {
          let categories = await base44.entities.TaxRuleCategory.filter({
            tax_type: suggestion.tax_type || 'ALLGEMEIN'
          });
          
          let category = categories[0];
          if (!category) {
            category = await base44.entities.TaxRuleCategory.create({
              category_code: suggestion.tax_type || 'ALLGEMEIN',
              display_name: suggestion.tax_type || 'Allgemein',
              tax_type: suggestion.tax_type || 'ALLGEMEIN',
              is_active: true
            });
          }
          
          if (suggestion.action === 'CREATE') {
            const newConfig = await base44.entities.TaxConfig.create({
              config_key: suggestion.config_key,
              category_id: category.id,
              display_name: suggestion.display_name,
              value_type: suggestion.value_type,
              value: String(suggestion.suggested_value),
              valid_from_tax_year: suggestion.valid_from_tax_year || new Date().getFullYear(),
              legal_reference: suggestion.legal_reference,
              bgbl_reference: taxLawUpdate.source_reference,
              source: 'AI_SUGGESTION',
              approved_by: user.email,
              approved_at: new Date().toISOString(),
              is_active: true
            });
            
            implementedConfigs.push(newConfig.id);
            
            await base44.entities.TaxRuleAuditLog.create({
              entity_type: 'TaxConfig',
              entity_id: newConfig.id,
              action: 'CREATE',
              new_values: newConfig,
              change_reason: `AI-Vorschlag aus ${taxLawUpdate.title}`,
              tax_law_update_id: tax_law_update_id,
              performed_by: user.email,
              performed_at: new Date().toISOString()
            });
          }
        } catch (configError) {
          errors.push(`Config ${suggestion.config_key}: ${configError.message}`);
        }
      }
    }
    
    // Apply rule suggestions
    if (approved_rule_indices && taxLawUpdate.suggested_rule_changes) {
      for (const index of approved_rule_indices) {
        const suggestion = taxLawUpdate.suggested_rule_changes[index];
        if (!suggestion) continue;
        
        try {
          let categories = await base44.entities.TaxRuleCategory.filter({
            tax_type: suggestion.tax_type || 'ALLGEMEIN'
          });
          
          let category = categories[0];
          if (!category) {
            category = await base44.entities.TaxRuleCategory.create({
              category_code: suggestion.tax_type || 'ALLGEMEIN',
              display_name: suggestion.tax_type || 'Allgemein',
              tax_type: suggestion.tax_type || 'ALLGEMEIN',
              is_active: true
            });
          }
          
          if (suggestion.action === 'CREATE') {
            const newRule = await base44.entities.TaxRule.create({
              rule_code: suggestion.rule_code,
              category_id: category.id,
              display_name: suggestion.display_name,
              rule_type: suggestion.rule_type,
              conditions: suggestion.conditions || {},
              actions: suggestion.actions || {},
              valid_from_tax_year: suggestion.valid_from_tax_year || new Date().getFullYear(),
              legal_reference: suggestion.legal_reference,
              bgbl_reference: taxLawUpdate.source_reference,
              source: 'AI_SUGGESTION',
              approved_by: user.email,
              approved_at: new Date().toISOString(),
              is_active: true
            });
            
            implementedRules.push(newRule.id);
            
            await base44.entities.TaxRuleAuditLog.create({
              entity_type: 'TaxRule',
              entity_id: newRule.id,
              action: 'CREATE',
              new_values: newRule,
              change_reason: `AI-Vorschlag aus ${taxLawUpdate.title}`,
              tax_law_update_id: tax_law_update_id,
              performed_by: user.email,
              performed_at: new Date().toISOString()
            });
          }
        } catch (ruleError) {
          errors.push(`Rule ${suggestion.rule_code}: ${ruleError.message}`);
        }
      }
    }
    
    // Mark update as implemented
    await base44.entities.TaxLawUpdate.update(tax_law_update_id, {
      status: 'IMPLEMENTED',
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes,
      implemented_configs: implementedConfigs,
      implemented_rules: implementedRules
    });
    
    return Response.json({
      success: true,
      implemented_configs: implementedConfigs,
      implemented_rules: implementedRules,
      errors: errors
    });
    
  } catch (error) {
    console.error('Error applying tax law suggestions:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});