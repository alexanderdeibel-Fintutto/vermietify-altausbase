import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, workflow_id, execution_id } = await req.json();

    // Get current execution
    const execution = await base44.asServiceRole.entities.WorkflowExecution.read(execution_id);

    if (!execution) {
      return Response.json({ error: 'Execution not found' }, { status: 404 });
    }

    // Get historical data
    const allExecutions = await base44.asServiceRole.entities.WorkflowExecution.filter({
      workflow_id,
      company_id,
      status: 'completed'
    }, '-completed_at', 50);

    // Calculate step predictions
    const currentProgress = calculateProgress(execution);
    const remainingSteps = getRemainingSteps(execution, allExecutions);
    const predictions = predictStepDurations(remainingSteps, allExecutions);

    // Get risk factors
    const riskFactors = analyzeRiskFactors(execution, allExecutions);

    // Use AI for delay prediction
    const prediction = await base44.integrations.Core.InvokeLLM({
      prompt: `Predict potential delays for this workflow execution.

Current Progress: ${currentProgress.percent}%
Current Step: ${currentProgress.current_step}
Remaining Steps: ${remainingSteps.length}

Predicted Step Durations:
${predictions.map(p => `${p.step_id}: ~${p.predicted_duration}s (confidence: ${p.confidence}%)`).join('\n')}

Risk Factors:
${riskFactors.map(r => `- ${r.factor}: ${r.severity}`).join('\n')}

Historical Average Duration: ${allExecutions.reduce((sum, ex) => sum + ex.execution_time_seconds, 0) / allExecutions.length}s

Provide: delay probability (%), estimated delay in minutes, risk level, and recommended mitigation.`,
      response_json_schema: {
        type: 'object',
        properties: {
          delay_probability_percent: { type: 'number' },
          estimated_delay_minutes: { type: 'number' },
          risk_level: { type: 'string' },
          predicted_completion_time: { type: 'string' },
          risk_factors: { type: 'array', items: { type: 'string' } },
          mitigation_recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      success: true,
      execution_id,
      current_progress: currentProgress,
      delay_prediction: prediction,
      remaining_steps: remainingSteps,
      step_predictions: predictions,
      risk_factors: riskFactors
    });
  } catch (error) {
    console.error('Predict workflow delays error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateProgress(execution) {
  const completed = execution.steps_completed?.length || 0;
  const total = completed + (execution.pending_approvals?.length || 0) + 1; // +1 for remaining

  return {
    percent: Math.round((completed / total) * 100),
    completed_steps: completed,
    total_estimated_steps: total,
    current_step: execution.current_step_id
  };
}

function getRemainingSteps(execution, historicalExecutions) {
  if (!historicalExecutions || historicalExecutions.length === 0) return [];

  // Get all step IDs from historical data
  const allSteps = new Set();
  historicalExecutions.forEach(ex => {
    (ex.steps_completed || []).forEach(step => allSteps.add(step.step_id));
  });

  const completedSteps = execution.steps_completed?.map(s => s.step_id) || [];
  return Array.from(allSteps).filter(step => !completedSteps.includes(step));
}

function predictStepDurations(remainingSteps, historicalExecutions) {
  const stepStats = {};

  historicalExecutions.forEach(execution => {
    (execution.steps_completed || []).forEach(step => {
      if (!stepStats[step.step_id]) {
        stepStats[step.step_id] = { durations: [], errors: 0 };
      }
      const duration = new Date(step.completed_at) - new Date(step.started_at);
      stepStats[step.step_id].durations.push(duration / 1000);
      if (step.error) stepStats[step.step_id].errors++;
    });
  });

  return remainingSteps.map(stepId => {
    const stats = stepStats[stepId];
    if (!stats || stats.durations.length === 0) {
      return {
        step_id: stepId,
        predicted_duration: 60,
        confidence: 30
      };
    }

    const avgDuration = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length;
    const errorRate = (stats.errors / stats.durations.length) * 100;

    return {
      step_id: stepId,
      predicted_duration: Math.round(avgDuration),
      confidence: Math.max(30, 100 - (errorRate * 5))
    };
  });
}

function analyzeRiskFactors(execution, historicalExecutions) {
  const risks = [];

  // Check for pending approvals (delays)
  if (execution.pending_approvals && execution.pending_approvals.length > 0) {
    risks.push({
      factor: 'Pending Approvals',
      severity: 'high',
      count: execution.pending_approvals.length
    });
  }

  // Check execution time vs average
  if (historicalExecutions.length > 0) {
    const avgTime = historicalExecutions.reduce((sum, ex) => sum + ex.execution_time_seconds, 0) / historicalExecutions.length;
    const currentTime = new Date() - new Date(execution.started_at);
    const currentSeconds = currentTime / 1000;

    if (currentSeconds > avgTime * 1.5) {
      risks.push({
        factor: 'Above Average Duration',
        severity: 'medium',
        value: `${Math.round(currentSeconds / avgTime)}x average`
      });
    }
  }

  // Check failure rate
  const failureRate = historicalExecutions.filter(ex => ex.status === 'failed').length / historicalExecutions.length;
  if (failureRate > 0.2) {
    risks.push({
      factor: 'High Historical Failure Rate',
      severity: 'high',
      rate: `${(failureRate * 100).toFixed(1)}%`
    });
  }

  return risks;
}