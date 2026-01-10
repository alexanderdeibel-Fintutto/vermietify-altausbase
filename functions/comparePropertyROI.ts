import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const buildings = await base44.entities.Building.list(null, 50);

  const properties = buildings.slice(0, 5).map(b => ({
    name: b.name || 'Objekt',
    roi: ((b.annual_rent || 0) / (b.purchase_price || 1) * 100).toFixed(1)
  }));

  return Response.json({ properties });
});