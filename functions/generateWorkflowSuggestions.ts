import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, limit = 5 } = await req.json();

    // Get user's recent executions
    const recentExecutions = await base44.asServiceRole.entities.WorkflowExecution.filter({
      company_id,
      started_by: user.email
    });

    // Get recent audit logs for user actions
    const auditLogs = await base44.asServiceRole.entities.AuditLog.filter({
      company_id,
      user_email: user.email
    });

    // Extract action patterns
    const actionPatterns = {};
    const documentActions = auditLogs
      .filter(log => log.entity_type === 'document')
      .slice(0, 20);

    const taskActions = auditLogs
      .filter(log => log.entity_type === 'task')
      .slice(0, 20);

    // Prepare context for AI
    const context = `
User Action History:
- Recent Document Actions: ${documentActions.length} actions (${documentActions.map(a => a.action_type).join(', ')})
- Recent Task Actions: ${taskActions.length} actions (${taskActions.map(a => a.action_type).join(', ')})
- Workflow Executions: ${recentExecutions.length} executions by this user

Most common patterns:
${
  recentExecutions.slice(0, 5).map(e => `- Workflow: ${e.workflow_id}, Status: ${e.status}`).join('\n')
}
    `;

    // Call AI to generate suggestions
    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on the user's action history, suggest 3-5 potential workflows or automation that could improve their productivity. Focus on patterns you see. Return a JSON array with suggestions.

${context}

Return ONLY a valid JSON array like this:
[
  {
    "title": "Workflow name",
    "description": "What this workflow does",
    "reasoning": "Why this matches their patterns",
    "estimated_time_savings": "minutes per occurrence"
  }
]`,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                reasoning: { type: 'string' },
                estimated_time_savings: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      suggestions: Array.isArray(suggestions) ? suggestions.slice(0, limit) : suggestions.suggestions || []
    });
  } catch (error) {
    console.error('Generate workflow suggestions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});