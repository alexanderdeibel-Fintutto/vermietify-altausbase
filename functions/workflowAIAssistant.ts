import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, user_query, action_type } = await req.json();

    // Get current workflow stats
    const runningExecutions = await base44.asServiceRole.entities.WorkflowExecution.filter({
      company_id,
      status: 'running'
    });

    const recentExecutions = await base44.asServiceRole.entities.WorkflowExecution.filter({
      company_id
    });

    const completedCount = recentExecutions.filter(e => e.status === 'completed').length;
    const failedCount = recentExecutions.filter(e => e.status === 'failed').length;

    const systemContext = `
Current Workflow Status:
- Running: ${runningExecutions.length} workflows
- Completed (total): ${completedCount}
- Failed (total): ${failedCount}
- Completion rate: ${completedCount > 0 ? ((completedCount / recentExecutions.length) * 100).toFixed(1) : 0}%

Running Workflows:
${
  runningExecutions.slice(0, 5)
    .map(e => `- ${e.workflow_id}: ${e.steps_completed?.length || 0} steps done, ${e.pending_approvals?.length || 0} approvals pending`)
    .join('\n')
}
    `;

    let prompt = '';

    if (action_type === 'status') {
      prompt = `Provide a brief status summary of current workflows. ${systemContext}`;
    } else if (action_type === 'optimization') {
      prompt = `Based on workflow statistics, identify ONE key optimization opportunity. Be specific and actionable. ${systemContext}`;
    } else if (action_type === 'chat') {
      prompt = `You are a workflow management assistant. Help the user with their workflow-related question. ${systemContext}\n\nUser question: ${user_query}`;
    } else if (action_type === 'pause_recommendation') {
      prompt = `Review the running workflows and recommend if any should be paused or cancelled, and why. ${systemContext}`;
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      response: typeof response === 'string' ? response : response.response || ''
    });
  } catch (error) {
    console.error('Workflow AI assistant error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});