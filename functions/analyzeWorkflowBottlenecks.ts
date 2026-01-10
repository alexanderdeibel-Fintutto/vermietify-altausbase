import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id } = await req.json();

    // Get recent executions
    const executions = await base44.asServiceRole.entities.WorkflowExecution.filter({
      company_id
    });

    // Analyze bottlenecks
    const stepBottlenecks = {};
    const approvalBottlenecks = {};
    let totalExecutionTime = 0;
    let completedCount = 0;

    executions.forEach(e => {
      if (e.execution_time_seconds) {
        totalExecutionTime += e.execution_time_seconds;
        if (e.status === 'completed') completedCount += 1;
      }

      // Step analysis
      e.steps_completed?.forEach(step => {
        const key = step.step_id;
        if (!stepBottlenecks[key]) {
          stepBottlenecks[key] = {
            total: 0,
            errors: 0,
            avg_time: 0,
            total_time: 0
          };
        }
        stepBottlenecks[key].total += 1;
        if (step.status === 'failed') stepBottlenecks[key].errors += 1;
        if (step.completed_at && step.started_at) {
          const time = new Date(step.completed_at) - new Date(step.started_at);
          stepBottlenecks[key].total_time += time;
        }
      });

      // Approval analysis
      e.pending_approvals?.forEach(approval => {
        const key = `${approval.step_id}_${approval.approval_type}`;
        if (!approvalBottlenecks[key]) {
          approvalBottlenecks[key] = {
            pending: 0,
            completed: 0,
            avg_wait_time: 0
          };
        }
        if (approval.approved_by?.length === 0) {
          approvalBottlenecks[key].pending += 1;
        } else {
          approvalBottlenecks[key].completed += 1;
        }
      });
    });

    // Calculate averages
    Object.keys(stepBottlenecks).forEach(key => {
      stepBottlenecks[key].avg_time = stepBottlenecks[key].total > 0
        ? (stepBottlenecks[key].total_time / stepBottlenecks[key].total / 1000 / 60).toFixed(2)
        : 0;
      stepBottlenecks[key].error_rate = stepBottlenecks[key].total > 0
        ? ((stepBottlenecks[key].errors / stepBottlenecks[key].total) * 100).toFixed(1)
        : 0;
    });

    const avgExecutionTime = completedCount > 0 ? (totalExecutionTime / completedCount / 60).toFixed(2) : 0;

    // Prepare data for AI analysis
    const bottleneckData = {
      avg_workflow_time: avgExecutionTime,
      step_issues: Object.entries(stepBottlenecks)
        .filter(([_, stats]) => stats.error_rate > 10 || stats.avg_time > 30)
        .map(([id, stats]) => ({
          step_id: id,
          error_rate: stats.error_rate,
          avg_time_minutes: stats.avg_time,
          failures: stats.errors
        })),
      approval_issues: Object.entries(approvalBottlenecks)
        .filter(([_, stats]) => stats.pending > 0)
        .map(([id, stats]) => ({
          approval_id: id,
          pending_count: stats.pending,
          completed_count: stats.completed
        }))
    };

    // Call AI for optimization suggestions
    const optimizations = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these workflow bottlenecks and provide 3-5 specific, actionable optimization recommendations:

Average workflow execution time: ${bottleneckData.avg_workflow_time} minutes

Top problematic steps:
${
  bottleneckData.step_issues
    .map(s => `- Step ${s.step_id}: ${s.error_rate}% failure rate, avg ${s.avg_time_minutes}min`)
    .join('\n')
}

Approval bottlenecks:
${
  bottleneckData.approval_issues
    .map(a => `- ${a.approval_id}: ${a.pending_count} pending`)
    .join('\n')
}

Provide recommendations as a JSON array with: title, description, expected_improvement, implementation_effort (low/medium/high).`,
      response_json_schema: {
        type: 'object',
        properties: {
          optimizations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                expected_improvement: { type: 'string' },
                implementation_effort: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      bottleneck_analysis: bottleneckData,
      optimizations: Array.isArray(optimizations) ? optimizations : optimizations.optimizations || []
    });
  } catch (error) {
    console.error('Analyze workflow bottlenecks error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});