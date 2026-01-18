import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { building_id, year } = payload;

    // Get building data
    const building = await base44.entities.Building.get(building_id);
    const units = await base44.entities.Unit.filter({ building_id });
    
    // Get all contracts for this building's units
    const unitIds = units.map(u => u.id);
    const allContracts = await base44.entities.LeaseContract.list();
    const contracts = allContracts.filter(c => unitIds.includes(c.unit_id));
    
    // Get financial data
    const allInvoices = await base44.entities.Invoice.list();
    const invoices = allInvoices.filter(i => i.building_id === building_id);
    
    // Calculate metrics
    const activeContracts = contracts.filter(c => c.status === 'Aktiv');
    const occupancyRate = units.length > 0 ? (activeContracts.length / units.length) * 100 : 0;
    
    const totalRent = activeContracts.reduce((sum, c) => sum + (c.kaltmiete || 0), 0);
    const annualRent = totalRent * 12;
    
    const totalExpenses = invoices
      .filter(i => new Date(i.rechnungsdatum).getFullYear() === year)
      .reduce((sum, i) => sum + (i.betrag || 0), 0);
    
    const netIncome = annualRent - totalExpenses;
    const roi = building.kaufpreis ? ((netIncome / building.kaufpreis) * 100).toFixed(2) : 0;

    // Generate report
    const report = {
      building: {
        adresse: building.adresse,
        ort: building.ort,
        baujahr: building.baujahr,
        einheiten_gesamt: units.length
      },
      occupancy: {
        total_units: units.length,
        occupied_units: activeContracts.length,
        vacant_units: units.length - activeContracts.length,
        occupancy_rate: occupancyRate.toFixed(2)
      },
      financials: {
        monthly_rent: totalRent,
        annual_rent: annualRent,
        total_expenses: totalExpenses,
        net_income: netIncome,
        roi: roi
      },
      year,
      generated_at: new Date().toISOString()
    };

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});