import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      company_id,
      workflow_id,
      start_date,
      end_date,
      workflow_type
    } = await req.json();

    const query = { company_id };
    if (workflow_id) query.workflow_id = workflow_id;

    // Fetch executions
    const executions = await base44.asServiceRole.entities.WorkflowExecution.filter(query);

    // Filter by date range
    const filtered = executions.filter(e => {
      const eDate = new Date(e.created_date);
      return eDate >= new Date(start_date) && eDate <= new Date(end_date);
    });

    // Calculate metrics
    const metrics = {
      total_executions: filtered.length,
      completed: filtered.filter(e => e.status === 'completed').length,
      failed: filtered.filter(e => e.status === 'failed').length,
      cancelled: filtered.filter(e => e.status === 'cancelled').length,
      running: filtered.filter(e => e.status === 'running').length
    };

    metrics.completion_rate = filtered.length > 0
      ? ((metrics.completed / filtered.length) * 100).toFixed(2)
      : 0;

    metrics.failure_rate = filtered.length > 0
      ? ((metrics.failed / filtered.length) * 100).toFixed(2)
      : 0;

    // Execution times
    const completedWithTime = filtered
      .filter(e => e.execution_time_seconds && e.status === 'completed')
      .map(e => e.execution_time_seconds);

    metrics.avg_execution_time = completedWithTime.length > 0
      ? (completedWithTime.reduce((a, b) => a + b, 0) / completedWithTime.length / 60).toFixed(2)
      : 0;

    metrics.min_execution_time = completedWithTime.length > 0
      ? (Math.min(...completedWithTime) / 60).toFixed(2)
      : 0;

    metrics.max_execution_time = completedWithTime.length > 0
      ? (Math.max(...completedWithTime) / 60).toFixed(2)
      : 0;

    // Step completion rates
    const allSteps = filtered
      .flatMap(e => e.steps_completed || []);

    const stepStats = {};
    allSteps.forEach(step => {
      if (!stepStats[step.step_id]) {
        stepStats[step.step_id] = { completed: 0, total: 0 };
      }
      stepStats[step.step_id].completed += step.status === 'completed' ? 1 : 0;
      stepStats[step.step_id].total += 1;
    });

    const step_completion_rates = Object.entries(stepStats).map(([stepId, stats]) => ({
      step_id: stepId,
      completion_rate: ((stats.completed / stats.total) * 100).toFixed(2),
      total_executions: stats.total
    }));

    // Approval bottlenecks
    const allApprovals = filtered
      .flatMap(e => e.pending_approvals || []);

    const approvalStats = {};
    allApprovals.forEach(approval => {
      const key = `${approval.step_id}_${approval.approval_type}`;
      if (!approvalStats[key]) {
        approvalStats[key] = { pending: 0, approved: 0, total: 0 };
      }
      approvalStats[key].pending += approval.approved_by?.length === 0 ? 1 : 0;
      approvalStats[key].approved += approval.approved_by?.length > 0 ? 1 : 0;
      approvalStats[key].total += 1;
    });

    const approval_bottlenecks = Object.entries(approvalStats).map(([key, stats]) => {
      const [stepId, approvalType] = key.split('_');
      return {
        step_id: stepId,
        approval_type: approvalType,
        pending_count: stats.pending,
        approved_count: stats.approved,
        avg_pending_time: stats.pending > 0 ? '2.5' : '0' // Placeholder
      };
    });

    // Timeline data
    const timeline = {};
    filtered.forEach(e => {
      const date = new Date(e.created_date).toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = { total: 0, completed: 0, failed: 0 };
      }
      timeline[date].total++;
      if (e.status === 'completed') timeline[date].completed++;
      if (e.status === 'failed') timeline[date].failed++;
    });

    const timeline_data = Object.entries(timeline).map(([date, stats]) => ({
      date,
      ...stats
    }));

    return Response.json({
      metrics,
      step_completion_rates,
      approval_bottlenecks,
      timeline_data,
      total_records: filtered.length
    });
  } catch (error) {
    console.error('Generate workflow analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});