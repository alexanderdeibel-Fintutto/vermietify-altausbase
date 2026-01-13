import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType } = await req.json();
    const entities = await base44.entities[entityType]?.list?.('-updated_date', 100) || [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate KPIs
    const kpis = [];
    const trends = [];

    if (entityType === 'Invoice') {
      const total = entities.reduce((sum, e) => sum + (e.amount || 0), 0);
      const paid = entities.filter(e => e.status === 'paid').length;
      const paymentRate = (paid / entities.length) * 100;

      kpis.push(
        { label: 'Gesamtumsatz', value: `€${(total / 1000).toFixed(0)}k`, target: 50000, unit: '€' },
        { label: 'Zahlungsquote', value: `${paymentRate.toFixed(0)}%`, target: 95, unit: '%' },
        { label: 'Rechnungen', value: entities.length, target: 100, unit: 'Stück' }
      );

      // Trends over time
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayEntities = entities.filter(e => {
          const eDate = new Date(e.created_date);
          return eDate.toDateString() === date.toDateString();
        });
        const dayTotal = dayEntities.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        trends.push({
          date: date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
          value: dayTotal
        });
      }
    }

    // Benchmark
    const benchmark = {
      yourValue: entities.length,
      average: 85,
      top: 150
    };

    return Response.json({
      data: {
        kpis: kpis,
        trends: trends,
        benchmark: benchmark
      }
    });

  } catch (error) {
    console.error('Metrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});