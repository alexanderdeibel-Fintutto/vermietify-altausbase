import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const buildings = await base44.entities.Building.list(null, 100);

  const properties = buildings.map(b => ({
    id: b.id,
    name: b.name,
    roi: ((b.annual_income || 50000) / (b.market_value || 1000000) * 100).toFixed(1)
  })).sort((a, b) => b.roi - a.roi);

  return Response.json({ properties });
});