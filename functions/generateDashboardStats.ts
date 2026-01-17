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
      base44.entities.LeaseContract.filter({ status: 'active' }),
      base44.entities.Invoice.list()
    ]);

    const occupiedUnits = contracts.length;
    const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;

    const totalRent = contracts.reduce((sum, c) => sum + (c.rent_cold || 0), 0);
    const totalExpenses = invoices
      .filter(i => i.payment_status === 'paid')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    const stats = {
      buildings: {
        total: buildings.length
      },
      units: {
        total: units.length,
        occupied: occupiedUnits,
        vacant: units.length - occupiedUnits,
        occupancy_rate: occupancyRate
      },
      tenants: {
        active: tenants.length
      },
      financial: {
        monthly_rent: totalRent,
        monthly_expenses: totalExpenses,
        net_income: totalRent - totalExpenses
      }
    };

    return Response.json(stats);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});