import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [buildings, units, tenants, contracts, invoices] = await Promise.all([
      base44.entities.Building.list(),
      base44.entities.Unit.list(),
      base44.entities.Tenant.list(),
      base44.entities.LeaseContract.list(),
      base44.entities.Invoice.list()
    ]);

    const activeContracts = contracts.filter(c => c.status === 'active');
    const totalRent = activeContracts.reduce((sum, c) => sum + (c.rent_cold || 0), 0);
    const totalExpenses = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const occupancyRate = units.length > 0 
      ? (activeContracts.length / units.length) * 100 
      : 0;

    return Response.json({
      buildings: {
        total: buildings.length,
        with_units: buildings.filter(b => units.some(u => u.building_id === b.id)).length
      },
      units: {
        total: units.length,
        occupied: activeContracts.length,
        vacant: units.length - activeContracts.length,
        occupancy_rate: Math.round(occupancyRate)
      },
      tenants: {
        total: tenants.length,
        active: activeContracts.length
      },
      financial: {
        monthly_rent: totalRent,
        monthly_expenses: totalExpenses,
        net_income: totalRent - totalExpenses
      }
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});