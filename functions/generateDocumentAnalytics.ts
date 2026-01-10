import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, period_days = 30 } = await req.json();

    const allDocs = await base44.asServiceRole.entities.Document.filter({ company_id });
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period_days);

    const recentDocs = allDocs.filter(d => new Date(d.created_date) > cutoff);

    const analytics = {
      total_documents: allDocs.length,
      documents_this_period: recentDocs.length,
      by_type: {},
      by_status: {},
      avg_processing_time: 0,
      most_viewed: [],
      pending_approvals: 0
    };

    // Aggregate by type
    recentDocs.forEach(d => {
      analytics.by_type[d.document_type] = (analytics.by_type[d.document_type] || 0) + 1;
    });

    // Get workflow executions for processing time
    const executions = await base44.asServiceRole.entities.WorkflowExecution.filter({ company_id });
    const validExecutions = executions.filter(e => e.execution_time_seconds);
    analytics.avg_processing_time = validExecutions.length > 0 
      ? validExecutions.reduce((sum, e) => sum + e.execution_time_seconds, 0) / validExecutions.length 
      : 0;

    // Pending approvals
    analytics.pending_approvals = executions.filter(e => 
      e.pending_approvals && e.pending_approvals.length > 0
    ).length;

    return Response.json({ success: true, analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});