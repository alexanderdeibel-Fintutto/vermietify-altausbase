import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const {
      company_id,
      task_description,
      task_type,
      priority,
      available_users,
      available_groups
    } = await req.json();

    // Get user performance history
    const assignmentHistory = await base44.asServiceRole.entities.AuditLog.filter({
      company_id,
      action_type: 'task_completed'
    }, '-created_date', 100);

    // Calculate user competency scores
    const userScores = calculateUserCompetencyScores(
      assignmentHistory,
      available_users,
      task_type
    );

    // Get current workload
    const pendingTasks = await base44.asServiceRole.entities.DocumentTask.filter({
      company_id,
      status: { $in: ['open', 'in_progress'] }
    });

    const workloadByUser = calculateWorkload(pendingTasks, available_users);

    // Use AI to recommend best assignee
    const recommendation = await base44.integrations.Core.InvokeLLM({
      prompt: `Given this task assignment scenario, recommend the best assignee.

Task: ${task_description}
Type: ${task_type}
Priority: ${priority}

User Competency Scores (0-100):
${Object.entries(userScores).map(([user, score]) => `${user}: ${score}`).join('\n')}

Current Workload (pending tasks):
${Object.entries(workloadByUser).map(([user, count]) => `${user}: ${count} tasks`).join('\n')}

Available Users: ${available_users.join(', ')}
Available Groups: ${available_groups?.join(', ') || 'none'}

Consider: competency match, current workload, deadline pressure, and team distribution.
Return the recommended assignee and rationale.`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommended_assignee: { type: 'string' },
          alternative_assignees: { type: 'array', items: { type: 'string' } },
          confidence_score: { type: 'number' },
          rationale: { type: 'string' },
          estimated_completion_time: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      recommendation: {
        ...recommendation,
        competency_scores: userScores,
        workload: workloadByUser,
        assignment_data: {
          company_id,
          task_description,
          task_type,
          priority,
          assigned_to: recommendation.recommended_assignee,
          assigned_at: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Intelligent task assignment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateUserCompetencyScores(history, users, taskType) {
  const scores = {};
  users.forEach(user => scores[user] = 50); // Base score

  history.forEach(log => {
    const user = log.user_email;
    if (users.includes(user)) {
      // Increase score for relevant task types
      if (log.metadata?.task_type === taskType) {
        scores[user] = Math.min(100, (scores[user] || 50) + 5);
      }
      // Boost for successful completions
      if (log.status === 'success') {
        scores[user] = Math.min(100, (scores[user] || 50) + 2);
      }
    }
  });

  return scores;
}

function calculateWorkload(pendingTasks, users) {
  const workload = {};
  users.forEach(user => workload[user] = 0);

  pendingTasks.forEach(task => {
    if (task.assigned_to && users.includes(task.assigned_to)) {
      workload[task.assigned_to]++;
    }
  });

  return workload;
}