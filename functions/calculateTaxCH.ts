import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Kantonale Steuersätze Schweiz (vereinfacht)
const CANTON_TAX_RATES = {
  ZH: { income: 0.085, wealth: 0.008, name: 'Zürich' },
  BE: { income: 0.082, wealth: 0.008, name: 'Bern' },
  LU: { income: 0.081, wealth: 0.007, name: 'Luzern' },
  SG: { income: 0.080, wealth: 0.007, name: 'Sankt Gallen' },
  AG: { income: 0.083, wealth: 0.008, name: 'Aargau' },
  TI: { income: 0.085, wealth: 0.008, name: 'Tessin' },
  VD: { income: 0.084, wealth: 0.009, name: 'Waadt' },
  VS: { income: 0.082, wealth: 0.008, name: 'Wallis' },
  GE: { income: 0.091, wealth: 0.009, name: 'Genf' },
  BS: { income: 0.082, wealth: 0.007, name: 'Basel-Stadt' }
};

// Bundessteuersätze (vereinfacht - Einkommen progressiv)
const FEDERAL_TAX_BRACKETS = [
  { threshold: 14_500, rate: 0.00 },
  { threshold: 28_000, rate: 0.055 },
  { threshold: 42_200, rate: 0.099 },
  { threshold: 72_100, rate: 0.137 },
  { threshold: 106_800, rate: 0.175 },
  { threshold: 154_700, rate: 0.207 },
  { threshold: 208_200, rate: 0.227 },
  { threshold: 267_500, rate: 0.246 },
  { threshold: 335_600, rate: 0.256 },
  { threshold: Infinity, rate: 0.264 }
];

const WEALTH_TAX_BRACKETS = [
  { threshold: 100_000, rate: 0.0 },
  { threshold: 1_000_000, rate: 0.002 },
  { threshold: Infinity, rate: 0.003 }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, canton } = await req.json();

    console.log(`Calculating Swiss tax for user: ${userId}, canton: ${canton}, year: ${taxYear}`);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!CANTON_TAX_RATES[canton]) {
      return Response.json({ error: 'Invalid canton' }, { status: 400 });
    }

    // Fetch investments
    const investments = await base44.entities.InvestmentCH.filter({
      tax_year: taxYear,
      canton: canton
    }) || [];

    // Fetch real estate
    const realEstates = await base44.entities.RealEstateCH.filter({
      tax_year: taxYear,
      canton: canton
    }) || [];

    // Calculate investment income
    let totalDividends = 0;
    let totalInterest = 0;
    let totalCapitalGains = 0;
    let totalUnrealizedGains = 0;
    let totalWithholdingTax = 0;

    const investmentDetails = [];
    for (const inv of investments) {
      totalDividends += inv.dividend_income || 0;
      totalInterest += inv.interest_income || 0;
      totalCapitalGains += inv.capital_gains || 0;
      totalCapitalGains -= inv.capital_losses || 0;
      totalUnrealizedGains += inv.unrealized_gains || 0;
      totalWithholdingTax += inv.withholding_tax_paid || 0;

      investmentDetails.push({
        title: inv.title,
        type: inv.investment_type,
        dividends: inv.dividend_income || 0,
        interest: inv.interest_income || 0,
        gains: (inv.capital_gains || 0) - (inv.capital_losses || 0)
      });
    }

    // Calculate real estate income
    let totalRentalIncome = 0;
    let totalPropertyExpenses = 0;
    let totalPropertyDebt = 0;
    let totalLandValue = 0;
    let totalBuildingValue = 0;

    const realEstateDetails = [];
    for (const property of realEstates) {
      if (!property.is_primary_residence) {
        totalRentalIncome += property.rental_income || 0;
        totalPropertyExpenses += (property.maintenance_costs || 0) + (property.property_tax || 0) + (property.insurance_costs || 0);
        totalPropertyExpenses += property.mortgage_interest_deductible || 0;
      }
      totalPropertyDebt += property.mortgage_debt || 0;
      totalLandValue += property.land_value || 0;
      totalBuildingValue += property.building_value || 0;

      realEstateDetails.push({
        title: property.title,
        type: property.property_type,
        rental: !property.is_primary_residence ? (property.rental_income || 0) : 0,
        value: property.current_market_value
      });
    }

    const netRentalIncome = Math.max(0, totalRentalIncome - totalPropertyExpenses);
    const totalIncome = totalDividends + totalInterest + totalCapitalGains + netRentalIncome;
    const totalWealth = totalLandValue + totalBuildingValue + totalUnrealizedGains;

    // Calculate federal tax
    let federalTax = 0;
    let previousThreshold = 0;
    for (const bracket of FEDERAL_TAX_BRACKETS) {
      if (totalIncome <= previousThreshold) break;
      const taxableInBracket = Math.min(totalIncome, bracket.threshold) - previousThreshold;
      federalTax += taxableInBracket * bracket.rate;
      previousThreshold = bracket.threshold;
    }

    // Calculate wealth tax
    let wealthTax = 0;
    previousThreshold = 0;
    for (const bracket of WEALTH_TAX_BRACKETS) {
      if (totalWealth <= previousThreshold) break;
      const taxableWealth = Math.min(totalWealth, bracket.threshold) - previousThreshold;
      wealthTax += taxableWealth * bracket.rate;
      previousThreshold = bracket.threshold;
    }

    // Calculate cantonal tax
    const cantonalIncomeTax = totalIncome * CANTON_TAX_RATES[canton].income;
    const cantonalWealthTax = totalWealth * CANTON_TAX_RATES[canton].wealth;

    const totalTax = federalTax + cantonalIncomeTax + wealthTax + cantonalWealthTax - totalWithholdingTax;

    return Response.json({
      success: true,
      taxYear,
      canton: CANTON_TAX_RATES[canton].name,
      income: {
        dividends: totalDividends,
        interest: totalInterest,
        capitalGains: totalCapitalGains,
        rentalIncome: netRentalIncome,
        total: totalIncome
      },
      wealth: {
        land: totalLandValue,
        buildings: totalBuildingValue,
        unrealizedGains: totalUnrealizedGains,
        debt: totalPropertyDebt,
        total: totalWealth
      },
      taxes: {
        federalIncomeTax: federalTax,
        cantonalIncomeTax: cantonalIncomeTax,
        federalWealthTax: wealthTax,
        cantonalWealthTax: cantonalWealthTax,
        withholdingTaxPaid: totalWithholdingTax,
        totalDue: Math.max(0, totalTax)
      },
      details: {
        investments: investmentDetails,
        realEstates: realEstateDetails
      },
      validationStatus: 'valid',
      summary: `Schweiz ${CANTON_TAX_RATES[canton].name} ${taxYear}: Bundessteuer CHF${federalTax.toFixed(2)}, Kantonssteuer CHF${cantonalIncomeTax.toFixed(2)}`
    });

  } catch (error) {
    console.error('Swiss tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});