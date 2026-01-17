import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { start_date, end_date } = body;

    const start = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = end_date ? new Date(end_date) : new Date();

    // Get user's entities
    const buildings = await base44.entities.Building.list();
    const units = await base44.entities.Unit.list();
    const tenants = await base44.entities.Tenant.list();
    const contracts = await base44.entities.LeaseContract.list();
    const invoices = await base44.entities.Invoice.list();
    const documents = await base44.entities.Document.list();

    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        buildings: buildings.length,
        units: units.length,
        tenants: tenants.length,
        active_contracts: contracts.filter(c => c.status === 'active').length,
        invoices: invoices.length,
        documents: documents.length
      },
      financial: {
        total_rent: contracts
          .filter(c => c.status === 'active')
          .reduce((sum, c) => sum + (c.rent_cold || 0), 0),
        total_expenses: invoices
          .reduce((sum, i) => sum + (i.amount || 0), 0)
      },
      generated_at: new Date().toISOString()
    };

    return Response.json(report);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});