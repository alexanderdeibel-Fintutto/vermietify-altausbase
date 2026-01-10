import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req, { requireAuth: false });

    const { workflow_id, trigger_id, company_id } = await req.json();

    // Get trigger
    const trigger = await base44.asServiceRole.entities.WorkflowTrigger.read(trigger_id);

    if (!trigger || !trigger.is_active) {
      return Response.json({ error: 'Trigger not found or inactive' }, { status: 404 });
    }

    // Evaluate trigger conditions
    let shouldExecute = true;
    const triggerData = await req.json();

    if (trigger.conditions && trigger.conditions.length > 0) {
      shouldExecute = trigger.conditions.every(cond =>
        evaluateTriggerCondition(cond, triggerData)
      );
    }

    if (!shouldExecute) {
      return Response.json({
        success: true,
        executed: false,
        reason: 'Trigger conditions not met'
      });
    }

    // Execute workflow
    const execution = await base44.asServiceRole.entities.WorkflowExecution.create({
      workflow_id,
      company_id,
      status: 'running',
      started_by: 'system',
      started_at: new Date().toISOString(),
      variables: triggerData,
      steps_completed: [],
      pending_approvals: []
    });

    // Log execution
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'workflow_executed',
      entity_type: 'workflow',
      entity_id: workflow_id,
      user_email: 'system',
      company_id,
      description: `Workflow triggered by ${trigger.trigger_type}: ${trigger.trigger_name}`,
      metadata: { trigger_id, execution_id: execution.id, trigger_type: trigger.trigger_type }
    });

    return Response.json({
      success: true,
      executed: true,
      execution_id: execution.id
    });
  } catch (error) {
    console.error('Handle workflow trigger webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function evaluateTriggerCondition(condition, data) {
  const { field, operator, value } = condition;
  const dataValue = getNestedValue(data, field);

  switch (operator) {
    case 'equals':
      return dataValue === value;
    case 'contains':
      return String(dataValue).includes(String(value));
    case 'greater_than':
      return Number(dataValue) > Number(value);
    case 'less_than':
      return Number(dataValue) < Number(value);
    default:
      return true;
  }
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}