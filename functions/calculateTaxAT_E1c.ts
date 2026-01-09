import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taxYear } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Calculating AT E1c (Vermietung) taxes for ${taxYear}`);

    // Fetch all real estate and rental data
    const realEstates = await base44.entities.RealEstate.filter({ tax_year: taxYear }) || [];

    // Calculate rental income (E1c - Einkünfte aus Vermietung und Verpachtung)
    let rentalIncome = 0;
    let rentalExpenses = 0;
    let depreciation = 0;
    let mortgageInterest = 0;
    let propertyTax = 0;
    let maintenanceCosts = 0;
    let insuranceCosts = 0;

    for (const property of realEstates) {
      // Rental income
      rentalIncome += property.annual_rental_income || 0;

      // Deductible expenses
      mortgageInterest += property.mortgage_interest || 0;
      propertyTax += property.property_tax || 0;
      maintenanceCosts += property.maintenance_costs || 0;
      insuranceCosts += property.insurance_costs || 0;

      // Depreciation (AfA) - simplified: 2% per year for building
      if (property.acquisition_cost && property.acquisition_date) {
        const acquisitionYear = new Date(property.acquisition_date).getFullYear();
        const yearsHeld = taxYear - acquisitionYear;
        if (yearsHeld >= 0) {
          const buildingValue = property.acquisition_cost * 0.8; // Assume 80% is building
          depreciation += buildingValue * 0.02; // 2% depreciation
        }
      }
    }

    rentalExpenses = mortgageInterest + propertyTax + maintenanceCosts + insuranceCosts + depreciation;

    // Net rental income (E1c taxable)
    const netRentalIncome = Math.max(0, rentalIncome - rentalExpenses);

    // Austrian tax calculation for E1c
    // E1c income is added to other income and taxed progressively
    // Tax brackets 2026 (simplified)
    const TAX_BRACKETS = [
      { limit: 25000, rate: 0.20 },
      { limit: 60000, rate: 0.30 },
      { limit: 90000, rate: 0.42 },
      { limit: Infinity, rate: 0.50 }
    ];

    let incomeTax = 0;
    let remaining = netRentalIncome;
    let previousLimit = 0;

    for (const bracket of TAX_BRACKETS) {
      if (remaining <= 0) break;
      const taxableInBracket = Math.min(remaining, bracket.limit - previousLimit);
      incomeTax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      previousLimit = bracket.limit;
    }

    const result = {
      taxYear,
      summary: {
        rentalIncome,
        mortgageInterest,
        propertyTax,
        maintenanceCosts,
        insuranceCosts,
        depreciation,
        totalExpenses: rentalExpenses,
        netRentalIncome
      },
      taxes: {
        estimatedIncomeTax: Math.round(incomeTax),
        surtax: Math.round(incomeTax * 0.05), // 5% Zuschlag
        churchTax: Math.round(incomeTax * 0.03), // 3% Kirchensteuer (Oberösterreich)
        totalTax: Math.round(incomeTax * 1.08)
      },
      details: {
        propertiesCount: realEstates.length,
        depreciationMethod: 'linear 2% per year'
      },
      timestamp: new Date().toISOString()
    };

    return Response.json(result);
  } catch (error) {
    console.error('Tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});