import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { period = 'yearly', years = 5 } = await req.json();

    console.log(`[TREND-ANALYSIS] Analyzing ${years} years`);

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - years;

    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: { $gte: startYear }
    });

    const trends = {
      by_year: {},
      by_form_type: {},
      by_status: {},
      confidence_trend: [],
      processing_time_trend: [],
      error_rate_trend: []
    };

    // Gruppiere nach Jahr
    submissions.forEach(sub => {
      const year = sub.tax_year;
      
      if (!trends.by_year[year]) {
        trends.by_year[year] = {
          count: 0,
          accepted: 0,
          rejected: 0,
          avg_confidence: 0,
          total_confidence: 0,
          error_count: 0
        };
      }

      trends.by_year[year].count++;
      if (sub.status === 'ACCEPTED') trends.by_year[year].accepted++;
      if (sub.status === 'REJECTED') trends.by_year[year].rejected++;
      if (sub.ai_confidence_score) {
        trends.by_year[year].total_confidence += sub.ai_confidence_score;
      }
      if (sub.validation_errors?.length > 0) {
        trends.by_year[year].error_count++;
      }
    });

    // Berechne Durchschnitte
    Object.keys(trends.by_year).forEach(year => {
      const data = trends.by_year[year];
      data.avg_confidence = data.count > 0 
        ? Math.round(data.total_confidence / data.count) 
        : 0;
      data.acceptance_rate = data.count > 0
        ? Math.round((data.accepted / data.count) * 100)
        : 0;
      data.error_rate = data.count > 0
        ? Math.round((data.error_count / data.count) * 100)
        : 0;
    });

    // Erstelle Trend-Arrays
    const sortedYears = Object.keys(trends.by_year).sort();
    sortedYears.forEach(year => {
      const data = trends.by_year[year];
      trends.confidence_trend.push({
        year: parseInt(year),
        value: data.avg_confidence
      });
      trends.error_rate_trend.push({
        year: parseInt(year),
        value: data.error_rate
      });
    });

    console.log(`[TREND-ANALYSIS] Analyzed ${submissions.length} submissions`);

    return Response.json({
      success: true,
      trends,
      summary: {
        total_submissions: submissions.length,
        years_analyzed: sortedYears.length,
        period: `${startYear}-${currentYear}`
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});