import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.toLowerCase();

    if (!query) {
      return Response.json({ results: [] });
    }

    const [buildings, tenants, contracts] = await Promise.all([
      base44.entities.Building.list(),
      base44.entities.Tenant.list(),
      base44.entities.LeaseContract.list()
    ]);

    const results = [];

    buildings.forEach(b => {
      if (b.adresse?.toLowerCase().includes(query) || b.ort?.toLowerCase().includes(query)) {
        results.push({
          type: 'building',
          id: b.id,
          title: b.adresse,
          subtitle: `${b.plz} ${b.ort}`,
          url: `/building-detail?id=${b.id}`
        });
      }
    });

    tenants.forEach(t => {
      if (t.name?.toLowerCase().includes(query) || t.email?.toLowerCase().includes(query)) {
        results.push({
          type: 'tenant',
          id: t.id,
          title: t.name,
          subtitle: t.email,
          url: `/tenant-detail?id=${t.id}`
        });
      }
    });

    contracts.forEach(c => {
      if (c.id?.toLowerCase().includes(query)) {
        results.push({
          type: 'contract',
          id: c.id,
          title: `Vertrag ${c.id}`,
          subtitle: `Status: ${c.status}`,
          url: `/contract-detail?id=${c.id}`
        });
      }
    });

    return Response.json({ results: results.slice(0, 10) });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});