import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [buildings, units, contracts, invoices, tasks] = await Promise.all([
      base44.entities.Building.list(),
      base44.entities.Unit.list(),
      base44.entities.LeaseContract.list(),
      base44.entities.Invoice.list(),
      base44.entities.Task.list()
    ]);

    const occupiedUnits = units.filter(u => contracts.some(c => c.unit_id === u.id && c.status === 'Aktiv'));
    const monthlyRent = contracts
      .filter(c => c.status === 'Aktiv')
      .reduce((sum, c) => sum + (c.kaltmiete || 0), 0);

    const stats = {
      buildings: {
        total: buildings.length,
        with_units: buildings.filter(b => units.some(u => u.building_id === b.id)).length
      },
      units: {
        total: units.length,
        occupied: occupiedUnits.length,
        vacant: units.length - occupiedUnits.length,
        occupancy_rate: units.length > 0 ? Math.round((occupiedUnits.length / units.length) * 100) : 0
      },
      contracts: {
        total: contracts.length,
        active: contracts.filter(c => c.status === 'Aktiv').length,
        expiring_soon: contracts.filter(c => {
          if (!c.ende_datum) return false;
          const end = new Date(c.ende_datum);
          const now = new Date();
          const diff = (end - now) / (1000 * 60 * 60 * 24);
          return diff > 0 && diff <= 90;
        }).length
      },
      financial: {
        monthly_rent: monthlyRent,
        unpaid_invoices: invoices.filter(i => i.status !== 'Bezahlt').length,
        total_unpaid: invoices.filter(i => i.status !== 'Bezahlt').reduce((sum, i) => sum + (i.betrag || 0), 0)
      },
      tasks: {
        total: tasks.length,
        open: tasks.filter(t => t.status === 'Offen').length,
        overdue: tasks.filter(t => {
          if (!t.faelligkeitsdatum || t.status === 'Erledigt') return false;
          return new Date(t.faelligkeitsdatum) < new Date();
        }).length
      }
    };

    return Response.json(stats);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});