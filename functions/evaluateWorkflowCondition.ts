import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const {
      condition_id,
      execution_context
    } = await req.json();

    // Get condition
    const condition = await base44.asServiceRole.entities.WorkflowCondition.read(condition_id);

    if (!condition) {
      return Response.json({ error: 'Condition not found' }, { status: 404 });
    }

    // Evaluate rules
    const logic = condition.logic || {};
    const rules = logic.rules || [];

    let matchedRule = null;
    let nextStepId = logic.default_next_step_id;

    for (const rule of rules) {
      if (evaluateRuleCondition(rule.condition, execution_context)) {
        matchedRule = rule;
        nextStepId = rule.next_step_id;
        break;
      }
    }

    return Response.json({
      success: true,
      matched_rule: matchedRule,
      next_step_id: nextStepId,
      action: matchedRule?.action || null
    });
  } catch (error) {
    console.error('Evaluate workflow condition error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function evaluateRuleCondition(condition, context) {
  if (!condition || !context) return false;

  const { field, operator, value } = condition;
  const contextValue = getNestedValue(context, field);

  switch (operator) {
    case 'equals':
      return contextValue === value || contextValue === JSON.parse(value);
    case 'not_equals':
      return contextValue !== value && contextValue !== JSON.parse(value);
    case 'contains':
      return String(contextValue).includes(String(value));
    case 'not_contains':
      return !String(contextValue).includes(String(value));
    case 'greater_than':
      return Number(contextValue) > Number(value);
    case 'less_than':
      return Number(contextValue) < Number(value);
    case 'greater_or_equal':
      return Number(contextValue) >= Number(value);
    case 'less_or_equal':
      return Number(contextValue) <= Number(value);
    case 'is_empty':
      return !contextValue || contextValue === '';
    case 'is_not_empty':
      return contextValue && contextValue !== '';
    case 'matches_regex':
      try {
        const regex = new RegExp(value);
        return regex.test(String(contextValue));
      } catch (e) {
        return false;
      }
    default:
      return false;
  }
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}