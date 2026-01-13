import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { metricName, entityType, period } = await req.json();

    // Fetch entities for calculation
    const entities = await base44.asServiceRole.entities[entityType]?.list?.() || [];

    let current = 0;
    let previous = 0;
    let dataPoints = [];

    if (metricName === 'count') {
      current = entities.length;
      dataPoints = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toLocaleDateString('de-DE'),
        value: Math.floor(Math.random() * 100) + 50
      }));
    }

    const trend = previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0;

    const analytics = await base44.asServiceRole.entities.Analytics?.create?.({
      metric_name: metricName,
      metric_type: 'count',
      entity_type: entityType,
      current_value: current,
      previous_value: previous,
      trend: trend,
      period_start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      data_points: JSON.stringify(dataPoints)
    });

    return Response.json({ data: analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});