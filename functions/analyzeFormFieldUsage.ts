import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_type, year_range = 3 } = await req.json();

    console.log(`[ANALYSIS] Analyzing field usage for ${form_type}`);

    const startYear = new Date().getFullYear() - year_range;
    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_form_type: form_type,
      tax_year: { $gte: startYear }
    });

    const fieldStats = {};

    submissions.forEach(sub => {
      if (!sub.form_data) return;

      Object.entries(sub.form_data).forEach(([field, value]) => {
        if (!fieldStats[field]) {
          fieldStats[field] = {
            count: 0,
            values: [],
            avg: 0,
            min: null,
            max: null
          };
        }

        fieldStats[field].count++;

        if (typeof value === 'number') {
          fieldStats[field].values.push(value);
        }
      });
    });

    // Berechne Statistiken
    Object.keys(fieldStats).forEach(field => {
      const stat = fieldStats[field];
      if (stat.values.length > 0) {
        stat.avg = stat.values.reduce((a, b) => a + b, 0) / stat.values.length;
        stat.min = Math.min(...stat.values);
        stat.max = Math.max(...stat.values);
      }
      stat.usage_rate = (stat.count / submissions.length) * 100;
    });

    const insights = {
      total_submissions: submissions.length,
      fields: fieldStats,
      most_used: Object.entries(fieldStats)
        .sort((a, b) => b[1].usage_rate - a[1].usage_rate)
        .slice(0, 10)
        .map(([field, stats]) => ({ field, ...stats })),
      rarely_used: Object.entries(fieldStats)
        .filter(([_, stats]) => stats.usage_rate < 20)
        .map(([field, stats]) => ({ field, ...stats }))
    };

    console.log(`[ANALYSIS] Analyzed ${Object.keys(fieldStats).length} fields`);

    return Response.json({
      success: true,
      insights
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});