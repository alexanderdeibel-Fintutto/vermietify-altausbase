import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, workflow_id, days_ahead = 7 } = await req.json();

    // Get historical executions
    const query = { company_id };
    if (workflow_id) query.workflow_id = workflow_id;

    const executions = await base44.asServiceRole.entities.WorkflowExecution.filter(query);

    // Filter completed executions for analysis
    const completedExecutions = executions
      .filter(e => e.status === 'completed' && e.execution_time_seconds)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    if (completedExecutions.length < 5) {
      return Response.json({
        success: true,
        predictions: [],
        message: 'Nicht genug historische Daten für zuverlässige Prognosen'
      });
    }

    // Calculate statistics
    const times = completedExecutions.map(e => e.execution_time_seconds / 60);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const stdDev = Math.sqrt(
      times.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / times.length
    );

    // Get current running executions
    const runningExecutions = executions.filter(e => e.status === 'running');

    // Predict completion times
    const predictions = runningExecutions.slice(0, 10).map(exec => {
      const stepsCompleted = exec.steps_completed?.length || 0;
      const totalExpectedSteps = exec.steps_completed?.length || 0 + exec.pending_approvals?.length || 0;
      const progressPercent = totalExpectedSteps > 0 ? (stepsCompleted / totalExpectedSteps) * 100 : 0;

      // Estimate remaining time
      const startTime = new Date(exec.started_at);
      const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
      let estimatedTotal = avgTime;

      // Adjust based on progress
      if (progressPercent > 0) {
        estimatedTotal = (elapsedMinutes / (progressPercent / 100));
      }

      const remainingMinutes = Math.max(0, estimatedTotal - elapsedMinutes);
      const expectedCompletion = new Date(Date.now() + remainingMinutes * 60 * 1000);

      // Probability of delay (based on 1.5x average time)
      const delayThreshold = avgTime * 1.5;
      const isAtRisk = elapsedMinutes > delayThreshold * 0.7;

      return {
        workflow_id: exec.workflow_id,
        execution_id: exec.id,
        progress_percent: Math.round(progressPercent),
        elapsed_minutes: Math.round(elapsedMinutes),
        estimated_remaining_minutes: Math.round(remainingMinutes),
        estimated_completion: expectedCompletion.toISOString(),
        avg_historical_time: Math.round(avgTime),
        delay_risk: isAtRisk ? 'high' : 'low',
        confidence: Math.min(95, Math.round(100 - (stdDev / avgTime) * 100))
      };
    });

    // Predict daily totals
    const dailyPredictions = [];
    for (let i = 1; i <= days_ahead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Estimate based on average completions per day
      const recentDays = 30;
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - recentDays);

      const recentCompletions = completedExecutions
        .filter(e => new Date(e.completed_at) >= recentDate).length;

      const avgPerDay = recentCompletions / recentDays;

      dailyPredictions.push({
        date: dateStr,
        predicted_completions: Math.round(avgPerDay),
        expected_avg_time: Math.round(avgTime),
        confidence: 85
      });
    }

    return Response.json({
      success: true,
      active_predictions: predictions,
      daily_forecasts: dailyPredictions,
      baseline_metrics: {
        avg_execution_time: Math.round(avgTime),
        std_deviation: Math.round(stdDev * 100) / 100,
        total_completed: completedExecutions.length
      }
    });
  } catch (error) {
    console.error('Predict workflow completion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});