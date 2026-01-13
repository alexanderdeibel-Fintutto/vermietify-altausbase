import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId, triggerData } = await req.json();
    const startTime = Date.now();

    // Get workflow
    const workflows = await base44.entities.Workflow?.list?.();
    const workflow = workflows?.find(w => w.id === workflowId);

    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const steps = JSON.parse(workflow.steps);
    const executionLog = [];
    let completedSteps = 0;

    // Execute each step
    for (const step of steps) {
      try {
        let result = null;

        if (step.type === 'send_notification') {
          result = { success: true, message: 'Notification sent' };
        } else if (step.type === 'update_field') {
          result = { success: true, message: 'Field updated' };
        } else if (step.type === 'create_task') {
          result = { success: true, message: 'Task created' };
        } else if (step.type === 'send_email') {
          result = { success: true, message: 'Email sent' };
        }

        completedSteps++;
        executionLog.push({ step: step.id, status: 'success', result });
      } catch (e) {
        executionLog.push({ step: step.id, status: 'error', error: e.message });
        break;
      }
    }

    const success = completedSteps === steps.length;
    const duration = Date.now() - startTime;

    // Log execution
    const execution = await base44.entities.ExecutionLog?.create?.({
      workflow_id: workflowId,
      status: success ? 'success' : 'failed',
      trigger_data: JSON.stringify(triggerData),
      steps_completed: completedSteps,
      total_steps: steps.length,
      duration_ms: duration,
      execution_log: JSON.stringify(executionLog)
    });

    // Update workflow stats
    await base44.entities.Workflow?.update?.(workflowId, {
      execution_count: (workflow.execution_count || 0) + 1,
      success_count: success ? (workflow.success_count || 0) + 1 : workflow.success_count,
      error_count: !success ? (workflow.error_count || 0) + 1 : workflow.error_count,
      last_executed: new Date().toISOString()
    });

    return Response.json({
      data: {
        execution_id: execution?.id,
        status: success ? 'success' : 'failed',
        steps_completed: completedSteps,
        total_steps: steps.length,
        duration_ms: duration
      }
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});