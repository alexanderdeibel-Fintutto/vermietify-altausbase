import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, workflow_id, days = 30 } = await req.json();

    // Get executions
    const executions = await base44.asServiceRole.entities.WorkflowExecution.filter({
      workflow_id,
      company_id
    });

    // Filter by date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentExecutions = executions.filter(ex =>
      new Date(ex.started_at) >= cutoffDate
    );

    if (recentExecutions.length === 0) {
      return Response.json({
        success: true,
        bottlenecks: [],
        suggestions: [],
        metrics: { total_executions: 0 }
      });
    }

    // Analyze step durations
    const stepAnalysis = analyzeStepDurations(recentExecutions);
    const bottlenecks = identifyBottlenecks(stepAnalysis);
    const suggestions = generateOptimizationSuggestions(stepAnalysis, bottlenecks, recentExecutions);

    // Get AI insights
    const aiSuggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these workflow bottlenecks and suggest optimizations:
      
Bottlenecks: ${JSON.stringify(bottlenecks, null, 2)}
Step Analysis: ${JSON.stringify(stepAnalysis, null, 2)}
Total Executions: ${recentExecutions.length}
Avg Duration: ${Math.round(getAverageDuration(recentExecutions))} seconds
Failed Executions: ${recentExecutions.filter(e => e.status === 'failed').length}

Provide 3-5 specific, actionable optimization recommendations in German.`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                estimated_improvement: { type: 'string' },
                priority: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      bottlenecks,
      suggestions: [...suggestions, ...aiSuggestions.recommendations],
      metrics: {
        total_executions: recentExecutions.length,
        successful_executions: recentExecutions.filter(e => e.status === 'completed').length,
        failed_executions: recentExecutions.filter(e => e.status === 'failed').length,
        average_duration_seconds: Math.round(getAverageDuration(recentExecutions)),
        success_rate: (recentExecutions.filter(e => e.status === 'completed').length / recentExecutions.length * 100).toFixed(2)
      },
      step_analysis: stepAnalysis
    });
  } catch (error) {
    console.error('Analyze workflow bottlenecks error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function analyzeStepDurations(executions) {
  const stepStats = {};

  executions.forEach(execution => {
    (execution.steps_completed || []).forEach(step => {
      if (!stepStats[step.step_id]) {
        stepStats[step.step_id] = {
          step_id: step.step_id,
          executions: 0,
          total_duration: 0,
          min_duration: Infinity,
          max_duration: 0,
          failures: 0
        };
      }

      const duration = new Date(step.completed_at) - new Date(step.started_at);
      stepStats[step.step_id].executions++;
      stepStats[step.step_id].total_duration += duration / 1000;
      stepStats[step.step_id].min_duration = Math.min(stepStats[step.step_id].min_duration, duration / 1000);
      stepStats[step.step_id].max_duration = Math.max(stepStats[step.step_id].max_duration, duration / 1000);
      if (step.error) stepStats[step.step_id].failures++;
    });
  });

  // Calculate averages
  Object.values(stepStats).forEach(stats => {
    stats.average_duration = Math.round(stats.total_duration / stats.executions);
    stats.failure_rate = (stats.failures / stats.executions * 100).toFixed(2);
  });

  return Object.values(stepStats).sort((a, b) => b.average_duration - a.average_duration);
}

function identifyBottlenecks(stepAnalysis) {
  const bottlenecks = [];
  const avgDuration = stepAnalysis.reduce((sum, s) => sum + s.average_duration, 0) / stepAnalysis.length;

  stepAnalysis.forEach(step => {
    if (step.average_duration > avgDuration * 1.5) {
      bottlenecks.push({
        step_id: step.step_id,
        type: 'slow_step',
        severity: step.average_duration > avgDuration * 2.5 ? 'critical' : 'high',
        average_duration: step.average_duration,
        impact: `This step takes ${Math.round(step.average_duration / avgDuration)}x the average time`
      });
    }

    if (parseFloat(step.failure_rate) > 5) {
      bottlenecks.push({
        step_id: step.step_id,
        type: 'high_failure_rate',
        severity: parseFloat(step.failure_rate) > 20 ? 'critical' : 'high',
        failure_rate: step.failure_rate,
        failures: step.failures
      });
    }
  });

  return bottlenecks;
}

function generateOptimizationSuggestions(stepAnalysis, bottlenecks, executions) {
  const suggestions = [];

  bottlenecks.forEach(bottleneck => {
    if (bottleneck.type === 'slow_step') {
      suggestions.push({
        title: `Optimize Step ${bottleneck.step_id}`,
        description: `This step is ${bottleneck.impact}. Consider parallel execution, caching, or external service optimization.`,
        estimated_improvement: `${Math.round((bottleneck.average_duration / 2) / getAverageDuration(executions) * 100)}% overall improvement`,
        priority: bottleneck.severity
      });
    }

    if (bottleneck.type === 'high_failure_rate') {
      suggestions.push({
        title: `Add Retry Logic to Step ${bottleneck.step_id}`,
        description: `This step fails in ${bottleneck.failure_rate}% of executions. Implement exponential backoff and error handling.`,
        estimated_improvement: `Reduce failure rate to <2%`,
        priority: bottleneck.severity
      });
    }
  });

  return suggestions;
}

function getAverageDuration(executions) {
  if (executions.length === 0) return 0;
  return executions.reduce((sum, ex) => {
    if (ex.execution_time_seconds) return sum + ex.execution_time_seconds;
    const duration = new Date(ex.completed_at) - new Date(ex.started_at);
    return sum + (duration / 1000);
  }, 0) / executions.length;
}