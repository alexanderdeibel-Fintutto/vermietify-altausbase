import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[TRENDS] Generating trend analysis');

    const submissions = await base44.entities.ElsterSubmission.list('-created_date', 500);

    const trends = {
      submission_volume: { trend: 'stable', data: [] },
      acceptance_rate: { trend: 'stable', data: [] },
      confidence_score: { trend: 'stable', data: [] },
      error_rate: { trend: 'stable', data: [] }
    };

    // Group by month
    const byMonth = {};
    submissions.forEach(sub => {
      const month = new Date(sub.created_date).toISOString().slice(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = { count: 0, accepted: 0, totalConfidence: 0, withConfidence: 0, errors: 0 };
      }
      byMonth[month].count++;
      if (sub.status === 'ACCEPTED') byMonth[month].accepted++;
      if (sub.ai_confidence_score) {
        byMonth[month].totalConfidence += sub.ai_confidence_score;
        byMonth[month].withConfidence++;
      }
      if (sub.validation_errors?.length > 0) byMonth[month].errors++;
    });

    // Calculate trends
    const months = Object.keys(byMonth).sort();
    months.forEach(month => {
      const data = byMonth[month];
      trends.submission_volume.data.push({ month, value: data.count });
      trends.acceptance_rate.data.push({ 
        month, 
        value: data.count > 0 ? Math.round((data.accepted / data.count) * 100) : 0 
      });
      trends.confidence_score.data.push({ 
        month, 
        value: data.withConfidence > 0 ? Math.round(data.totalConfidence / data.withConfidence) : 0 
      });
      trends.error_rate.data.push({ 
        month, 
        value: data.count > 0 ? Math.round((data.errors / data.count) * 100) : 0 
      });
    });

    // Determine trend direction
    const determineTrend = (data) => {
      if (data.length < 2) return 'stable';
      const recent = data.slice(-3);
      const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
      const prev = data.slice(-6, -3);
      if (prev.length === 0) return 'stable';
      const prevAvg = prev.reduce((sum, d) => sum + d.value, 0) / prev.length;
      if (avg > prevAvg * 1.1) return 'increasing';
      if (avg < prevAvg * 0.9) return 'decreasing';
      return 'stable';
    };

    trends.submission_volume.trend = determineTrend(trends.submission_volume.data);
    trends.acceptance_rate.trend = determineTrend(trends.acceptance_rate.data);
    trends.confidence_score.trend = determineTrend(trends.confidence_score.data);
    trends.error_rate.trend = determineTrend(trends.error_rate.data);

    return Response.json({ success: true, trends });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});