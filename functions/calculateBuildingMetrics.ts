import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { building_id } = payload;

    // Get all related data
    const building = await base44.entities.Building.get(building_id);
    const units = await base44.entities.Unit.filter({ building_id });
    
    const allContracts = await base44.entities.LeaseContract.list();
    const contracts = allContracts.filter(c => 
      units.some(u => u.id === c.unit_id)
    );
    
    const activeContracts = contracts.filter(c => c.status === 'Aktiv');
    
    // Calculate occupancy
    const occupancyRate = units.length > 0 
      ? (activeContracts.length / units.length) * 100 
      : 0;
    
    // Calculate rental income
    const monthlyRent = activeContracts.reduce((sum, c) => 
      sum + (c.kaltmiete || 0), 0
    );
    
    const monthlyNebenkosten = activeContracts.reduce((sum, c) => 
      sum + (c.nebenkosten_vorauszahlung || 0), 0
    );
    
    const annualIncome = (monthlyRent + monthlyNebenkosten) * 12;
    
    // Get expenses
    const allInvoices = await base44.entities.Invoice.list();
    const buildingInvoices = allInvoices.filter(i => i.building_id === building_id);
    
    const currentYear = new Date().getFullYear();
    const yearlyExpenses = buildingInvoices
      .filter(i => new Date(i.rechnungsdatum).getFullYear() === currentYear)
      .reduce((sum, i) => sum + (i.betrag || 0), 0);
    
    // Calculate ROI
    const netIncome = annualIncome - yearlyExpenses;
    const roi = building.kaufpreis && building.kaufpreis > 0
      ? ((netIncome / building.kaufpreis) * 100).toFixed(2)
      : 0;
    
    // Calculate average rent per sqm
    const totalFlaeche = units.reduce((sum, u) => sum + (u.flaeche_qm || 0), 0);
    const rentPerSqm = totalFlaeche > 0 
      ? (monthlyRent / totalFlaeche).toFixed(2) 
      : 0;

    return Response.json({
      success: true,
      metrics: {
        occupancy_rate: occupancyRate.toFixed(2),
        total_units: units.length,
        occupied_units: activeContracts.length,
        vacant_units: units.length - activeContracts.length,
        monthly_rent: monthlyRent,
        monthly_nebenkosten: monthlyNebenkosten,
        annual_income: annualIncome,
        yearly_expenses: yearlyExpenses,
        net_income: netIncome,
        roi: parseFloat(roi),
        rent_per_sqm: parseFloat(rentPerSqm),
        total_flaeche: totalFlaeche
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});