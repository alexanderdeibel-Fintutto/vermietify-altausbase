import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query } = await req.json();
  const results = [];

  const buildings = await base44.entities.Building.list(null, 100);
  const tenants = await base44.entities.Tenant.list(null, 100);
  const documents = await base44.entities.Document.list(null, 100);

  for (const building of buildings) {
    if (building.name?.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        type: 'Gebäude',
        title: building.name,
        snippet: building.address
      });
    }
  }

  for (const tenant of tenants) {
    if (tenant.full_name?.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        type: 'Mieter',
        title: tenant.full_name,
        snippet: tenant.email
      });
    }
  }

  return Response.json({ results });
});