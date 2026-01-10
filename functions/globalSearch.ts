import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query } = await req.json();

  if (!query || query.length < 2) {
    return Response.json({
      Building: [],
      Tenant: [],
      LeaseContract: [],
      Document: []
    });
  }

  const searchTerm = query.toLowerCase();

  // Search Buildings
  const buildings = await base44.entities.Building.list();
  const matchedBuildings = buildings
    .filter(b => 
      b.name?.toLowerCase().includes(searchTerm) ||
      b.address?.toLowerCase().includes(searchTerm) ||
      b.city?.toLowerCase().includes(searchTerm)
    )
    .map(b => ({
      id: b.id,
      name: b.name,
      description: `${b.address}, ${b.postal_code} ${b.city}`,
      metadata: {
        Einheiten: b.total_units || 0
      }
    }))
    .slice(0, 5);

  // Search Tenants
  const tenants = await base44.entities.Tenant.list();
  const matchedTenants = tenants
    .filter(t =>
      t.first_name?.toLowerCase().includes(searchTerm) ||
      t.last_name?.toLowerCase().includes(searchTerm) ||
      t.email?.toLowerCase().includes(searchTerm)
    )
    .map(t => ({
      id: t.id,
      name: `${t.first_name} ${t.last_name}`,
      description: t.email,
      metadata: {
        Status: t.status || 'Aktiv'
      }
    }))
    .slice(0, 5);

  // Search Contracts
  const contracts = await base44.entities.LeaseContract.list();
  const matchedContracts = contracts
    .filter(c => {
      const tenant = tenants.find(t => t.id === c.tenant_id);
      return tenant && (
        tenant.first_name?.toLowerCase().includes(searchTerm) ||
        tenant.last_name?.toLowerCase().includes(searchTerm)
      );
    })
    .map(c => {
      const tenant = tenants.find(t => t.id === c.tenant_id);
      return {
        id: c.id,
        name: `Vertrag: ${tenant?.first_name} ${tenant?.last_name}`,
        description: `Beginn: ${c.start_date}`,
        metadata: {
          Miete: `${c.total_rent}€`,
          Status: c.status
        }
      };
    })
    .slice(0, 5);

  // Search Documents
  const documents = await base44.entities.Document.list();
  const matchedDocuments = documents
    .filter(d =>
      d.name?.toLowerCase().includes(searchTerm) ||
      d.category?.toLowerCase().includes(searchTerm) ||
      d.ai_summary?.toLowerCase().includes(searchTerm)
    )
    .map(d => ({
      id: d.id,
      name: d.name,
      description: d.ai_summary || d.category,
      metadata: {
        Status: d.status
      }
    }))
    .slice(0, 5);

  return Response.json({
    Building: matchedBuildings,
    Tenant: matchedTenants,
    LeaseContract: matchedContracts,
    Document: matchedDocuments
  });
});