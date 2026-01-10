import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, days = 30 } = await req.json();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get analytics data
    const allAnalytics = await base44.asServiceRole.entities.DocumentAnalytics.filter({
      company_id
    });

    const recentAnalytics = allAnalytics.filter(a => new Date(a.date) >= startDate);

    // Aggregate by metric type
    const metrics = {
      documents_created: 0,
      signatures_sent: 0,
      signatures_completed: 0,
      signatures_rejected: 0,
      templates_used: 0,
      batch_uploads: 0
    };

    const dailyData = {};
    const templateUsage = {};

    recentAnalytics.forEach(a => {
      const metricKey = a.metric_type.replace('_', '_');
      if (metrics.hasOwnProperty(metricKey)) {
        metrics[metricKey] += a.count || 1;
      }

      // Daily breakdown
      if (!dailyData[a.date]) dailyData[a.date] = {};
      dailyData[a.date][a.metric_type] = (dailyData[a.date][a.metric_type] || 0) + (a.count || 1);

      // Template tracking
      if (a.metric_type === 'template_used' && a.details?.template_id) {
        templateUsage[a.details.template_id] = (templateUsage[a.details.template_id] || 0) + 1;
      }
    });

    // Get signature request statuses
    const signatureRequests = await base44.asServiceRole.entities.SignatureRequest.filter({
      company_id
    });

    const signatureStats = {
      total: signatureRequests.length,
      completed: 0,
      pending: 0,
      rejected: 0
    };

    signatureRequests.forEach(req => {
      if (req.status === 'completed') signatureStats.completed++;
      else if (req.status === 'rejected') signatureStats.rejected++;
      else signatureStats.pending++;
    });

    return Response.json({
      metrics,
      dailyData: Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
      templateUsage: Object.entries(templateUsage)
        .map(([template_id, count]) => ({ template_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      signatureStats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});