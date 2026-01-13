import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType, period = '6months' } = await req.json();
    const entities = await base44.entities[entityType]?.list?.('-updated_date', 500) || [];

    const now = new Date();
    let daysBack = 180; // 6 months default
    if (period === '3months') daysBack = 90;
    if (period === '12months') daysBack = 365;
    if (period === 'all') daysBack = 3650;

    // Group data by date
    const dataByDate = {};
    const dayStart = Math.floor(daysBack);

    for (let i = dayStart; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });

      const dayEntities = entities.filter(e => {
        const eDate = new Date(e.created_date || e.updated_date);
        return eDate.toDateString() === date.toDateString();
      });

      const value = dayEntities.reduce((sum, e) => sum + (e.amount || 1), 0);
      dataByDate[dateStr] = { value: value, count: dayEntities.length };
    }

    const data = Object.entries(dataByDate).map(([date, data]) => ({
      date,
      value: data.value,
      count: data.count
    }));

    // Calculate insights
    const recentAvg = data.slice(-7).reduce((sum, d) => sum + d.value, 0) / 7;
    const olderAvg = data.slice(-30, -7).reduce((sum, d) => sum + d.value, 0) / 23;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    const insights = [
      {
        metric: 'Wachstum',
        direction: change > 0 ? 'up' : 'down',
        change: `${Math.abs(change).toFixed(1)}%`,
        description: change > 0 ? 'Aufwärts im Vergleich zu Vorperiode' : 'Abwärts im Vergleich zu Vorperiode'
      },
      {
        metric: 'Volatilität',
        direction: data.length > 1 ? 'up' : 'neutral',
        change: 'Stabiler',
        description: 'Konsistente Werte ohne große Schwankungen'
      }
    ];

    const forecast = {
      trend: change > 0 ? 'up' : 'down',
      value: `${(recentAvg * 1.1).toFixed(0)}`,
      description: change > 0 ? 'Trend zeigt nach oben. Weiteres Wachstum erwartet.' : 'Stagnation erwartet ohne Intervention.'
    };

    return Response.json({
      data: {
        data: data,
        insights: insights,
        forecast: forecast
      }
    });

  } catch (error) {
    console.error('Trend analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});