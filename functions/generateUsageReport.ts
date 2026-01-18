import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [buildings, tenants, contracts, invoices] = await Promise.all([
      base44.asServiceRole.entities.Building.list(),
      base44.asServiceRole.entities.Tenant.list(),
      base44.asServiceRole.entities.LeaseContract.list(),
      base44.asServiceRole.entities.Invoice.list()
    ]);

    const report = {
      generated_at: new Date().toISOString(),
      total_buildings: buildings.length,
      total_tenants: tenants.length,
      total_contracts: contracts.length,
      total_invoices: invoices.length,
      active_contracts: contracts.filter(c => c.status === 'Aktiv').length,
      paid_invoices: invoices.filter(i => i.status === 'Bezahlt').length
    };

    return Response.json(report);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});