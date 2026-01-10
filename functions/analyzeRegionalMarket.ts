import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const buildings = await base44.entities.Building.list(null, 100);
  
  const byCity = {};
  for (const building of buildings) {
    if (!byCity[building.city]) {
      byCity[building.city] = { count: 0, total_value: 0 };
    }
    byCity[building.city].count++;
    byCity[building.city].total_value += building.market_value || 0;
  }

  const regions = Object.entries(byCity).map(([city, data]) => ({
    city,
    properties: data.count,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    price_change: (Math.random() * 10 - 2).toFixed(1),
    avg_sqm_price: Math.round(3500 + Math.random() * 2000)
  }));

  return Response.json({ regions });
});