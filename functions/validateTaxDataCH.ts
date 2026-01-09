import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, canton } = await req.json();

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const errors = [];
    const warnings = [];

    // Fetch data
    const investments = await base44.entities.InvestmentCH.filter({
      tax_year: taxYear,
      canton: canton
    }) || [];

    const realEstates = await base44.entities.RealEstateCH.filter({
      tax_year: taxYear,
      canton: canton
    }) || [];

    // Validate investments
    for (const inv of investments) {
      if (!inv.acquisition_date || !inv.acquisition_price || inv.acquisition_price <= 0) {
        errors.push(`Wertschrift "${inv.title}": Erwerbsdatum und Preis erforderlich`);
      }
      if (!inv.current_value || inv.current_value < 0) {
        errors.push(`Wertschrift "${inv.title}": Aktueller Marktwert erforderlich`);
      }
      if (inv.dividend_income < 0 || inv.interest_income < 0) {
        errors.push(`Wertschrift "${inv.title}": Negative Erträge nicht zulässig`);
      }
      if (inv.capital_gains > 1000000) {
        warnings.push(`Wertschrift "${inv.title}": Kursgewinn CHF${inv.capital_gains} wirkt unrealistisch hoch`);
      }
    }

    // Validate real estate
    for (const property of realEstates) {
      if (!property.address || !property.municipality) {
        errors.push(`Liegenschaft "${property.title}": Adresse und Gemeinde erforderlich`);
      }
      if (property.acquisition_price <= 0 || property.current_market_value <= 0) {
        errors.push(`Liegenschaft "${property.title}": Kaufpreis und Marktwert erforderlich`);
      }
      if (property.rental_income < 0 || property.maintenance_costs < 0) {
        errors.push(`Liegenschaft "${property.title}": Negative Beträge nicht zulässig`);
      }
      if (property.mortgage_debt > property.current_market_value * 0.9) {
        warnings.push(`Liegenschaft "${property.title}": Hypothekarschuld sehr hoch im Verhältnis zum Wert`);
      }
      if (!property.is_primary_residence && property.rental_income === 0) {
        warnings.push(`Liegenschaft "${property.title}": Mietobjekt ohne Mieteinnahmen`);
      }
    }

    // Consistency checks
    let totalIncome = 0;
    investments.forEach(inv => {
      totalIncome += (inv.dividend_income || 0) + (inv.interest_income || 0);
    });
    realEstates.forEach(prop => {
      if (!prop.is_primary_residence) {
        totalIncome += Math.max(0, (prop.rental_income || 0) - (prop.maintenance_costs || 0));
      }
    });

    if (totalIncome === 0 && investments.length === 0 && realEstates.length === 0) {
      warnings.push('Keine Vermögenserträge erfasst');
    }

    return Response.json({
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        investmentsCount: investments.length,
        realEstateCount: realEstates.length,
        totalIncome: totalIncome,
        canton: canton,
        taxYear: taxYear
      }
    });

  } catch (error) {
    console.error('Swiss validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});