import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { query } = body;

    if (!query || query.length < 2) {
      return Response.json({ results: [] });
    }

    const searchTerm = query.toLowerCase();
    
    const [buildings, tenants, contracts] = await Promise.all([
      base44.entities.Building.list(),
      base44.entities.Tenant.list(),
      base44.entities.LeaseContract.list()
    ]);

    const results = [];

    buildings.forEach(b => {
      if (b.name?.toLowerCase().includes(searchTerm) || 
          b.address?.toLowerCase().includes(searchTerm)) {
        results.push({
          id: b.id,
          type: 'building',
          title: b.name,
          subtitle: b.address,
          url: `/BuildingDetail?id=${b.id}`
        });
      }
    });

    tenants.forEach(t => {
      if (t.name?.toLowerCase().includes(searchTerm) || 
          t.email?.toLowerCase().includes(searchTerm)) {
        results.push({
          id: t.id,
          type: 'tenant',
          title: t.name,
          subtitle: t.email,
          url: `/TenantDetail?id=${t.id}`
        });
      }
    });

    contracts.forEach(c => {
      if (c.tenant_name?.toLowerCase().includes(searchTerm)) {
        results.push({
          id: c.id,
          type: 'contract',
          title: `Vertrag ${c.tenant_name}`,
          subtitle: c.unit_name,
          url: `/ContractDetail?id=${c.id}`
        });
      }
    });

    return Response.json({ results: results.slice(0, 10) });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});