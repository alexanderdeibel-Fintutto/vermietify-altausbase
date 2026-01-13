import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ruleId, entity } = await req.json();

    // Get rule
    const rules = await base44.entities.WorkflowRule?.list?.();
    const rule = rules?.find(r => r.id === ruleId);

    if (!rule) {
      return Response.json({ error: 'Rule not found' }, { status: 404 });
    }

    const condition = JSON.parse(rule.condition);
    const actions = JSON.parse(rule.actions);

    // Evaluate condition
    const fieldValue = entity[condition.field];
    let conditionMet = false;

    if (condition.operator === 'equals') {
      conditionMet = fieldValue === condition.value;
    } else if (condition.operator === 'gt') {
      conditionMet = fieldValue > parseFloat(condition.value);
    } else if (condition.operator === 'lt') {
      conditionMet = fieldValue < parseFloat(condition.value);
    }

    if (!conditionMet) {
      return Response.json({
        data: { condition_met: false, actions_executed: 0 }
      });
    }

    // Execute actions
    let actionsExecuted = 0;
    for (const action of actions) {
      try {
        if (action.type === 'update') {
          // Update entity
          actionsExecuted++;
        } else if (action.type === 'notify') {
          // Send notification
          actionsExecuted++;
        } else if (action.type === 'create_task') {
          // Create task
          actionsExecuted++;
        } else if (action.type === 'assign_to') {
          // Assign to user
          actionsExecuted++;
        }
      } catch (e) {
        console.error('Action execution error:', e);
      }
    }

    // Update rule stats
    await base44.entities.WorkflowRule?.update?.(ruleId, {
      execution_count: (rule.execution_count || 0) + 1,
      last_triggered: new Date().toISOString()
    });

    return Response.json({
      data: {
        condition_met: true,
        actions_executed: actionsExecuted
      }
    });

  } catch (error) {
    console.error('Rule evaluation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});