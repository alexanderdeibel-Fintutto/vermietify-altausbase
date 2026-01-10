import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { execution_id } = await req.json();

    // Get execution
    const executions = await base44.asServiceRole.entities.WorkflowExecution.filter({
      id: execution_id
    });

    if (executions.length === 0) {
      return Response.json({ error: 'Execution not found' }, { status: 404 });
    }

    const execution = executions[0];

    if (execution.status !== 'running') {
      return Response.json({
        error: `Workflow can only be cancelled if running. Current status: ${execution.status}`
      }, { status: 400 });
    }

    // Cancel execution
    await base44.asServiceRole.entities.WorkflowExecution.update(execution_id, {
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      error_message: `Abgebrochen von ${user.email}`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Cancel workflow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});