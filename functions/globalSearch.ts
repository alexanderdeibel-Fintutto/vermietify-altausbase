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
    const results = [];

    // Search Buildings
    const buildings = await base44.entities.Building.list();
    buildings.forEach(building => {
      if (building.name?.toLowerCase().includes(searchTerm) || 
          building.address?.toLowerCase().includes(searchTerm)) {
        results.push({
          id: building.id,
          entity_type: 'Building',
          title: building.name,
          subtitle: building.address
        });
      }
    });

    // Search Tenants
    const tenants = await base44.entities.Tenant.list();
    tenants.forEach(tenant => {
      if (tenant.name?.toLowerCase().includes(searchTerm) ||
          tenant.email?.toLowerCase().includes(searchTerm)) {
        results.push({
          id: tenant.id,
          entity_type: 'Tenant',
          title: tenant.name,
          subtitle: tenant.email
        });
      }
    });

    // Search Contracts
    const contracts = await base44.entities.LeaseContract.list();
    contracts.forEach(contract => {
      if (contract.tenant_name?.toLowerCase().includes(searchTerm)) {
        results.push({
          id: contract.id,
          entity_type: 'LeaseContract',
          title: `Vertrag: ${contract.tenant_name}`,
          subtitle: contract.unit_name
        });
      }
    });

    return Response.json({ results: results.slice(0, 20) });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});