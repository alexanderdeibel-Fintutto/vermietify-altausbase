import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, canton } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Calculating CH taxes for ${canton} in ${taxYear}`);

    // Fetch all CH tax data
    const [investments, realEstate] = await Promise.all([
      base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [],
      base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || []
    ]);

    // Canton tax rates (simplified example for Zurich/ZH)
    const CANTONAL_RATES = {
      ZH: { federal: 0.077, cantonal: 0.082, communal: 0.038 },
      BE: { federal: 0.077, cantonal: 0.075, communal: 0.035 },
      // ... add other cantons as needed
    };

    const rates = CANTONAL_RATES[canton] || CANTONAL_RATES.ZH;

    // Calculate investment income (Wertschriften)
    let dividendIncome = 0;
    let interestIncome = 0;
    let capitalGains = 0;

    for (const inv of investments) {
      dividendIncome += inv.dividend_income || 0;
      interestIncome += inv.interest_income || 0;
      capitalGains += inv.capital_gains || 0;
    }

    // Calculate real estate income (Liegenschaften)
    let rentalIncome = 0;
    let rentalExpenses = 0;
    let mortgageInterest = 0;
    let propertyTax = 0;
    let realEstateValue = 0;

    for (const re of realEstate) {
      rentalIncome += re.rental_income || 0;
      rentalExpenses += (re.maintenance_costs || 0) + (re.insurance_costs || 0);
      mortgageInterest += re.mortgage_interest_deductible || 0;
      propertyTax += re.property_tax || 0;
      realEstateValue += re.current_market_value || 0;
    }

    const netRentalIncome = rentalIncome - rentalExpenses - mortgageInterest - propertyTax;

    // Total income
    const totalIncome = dividendIncome + interestIncome + capitalGains + Math.max(0, netRentalIncome);

    // Wealth tax (Vermögenssteuer) - Swiss federal level
    const totalWealth = investments.reduce((sum, inv) => sum + (inv.quantity * inv.current_value || 0), 0) + realEstateValue;
    const WEALTH_TAX_THRESHOLD = 100000;
    const WEALTH_TAX_RATE = 0.001; // 0.1%
    const wealthTax = totalWealth > WEALTH_TAX_THRESHOLD ? (totalWealth - WEALTH_TAX_THRESHOLD) * WEALTH_TAX_RATE : 0;

    // Income tax calculation (simplified)
    const federalTax = totalIncome * rates.federal;
    const cantonalTax = totalIncome * rates.cantonal;
    const communalTax = totalIncome * rates.communal;
    const totalIncomeTax = federalTax + cantonalTax + communalTax;

    // Withholding tax credit
    const withholdingTaxPaid = investments.reduce((sum, inv) => sum + (inv.withholding_tax_paid || 0), 0);

    const result = {
      taxYear,
      canton,
      summary: {
        dividendIncome: Math.round(dividendIncome),
        interestIncome: Math.round(interestIncome),
        capitalGains: Math.round(capitalGains),
        rentalIncome: Math.round(rentalIncome),
        rentalExpenses: Math.round(rentalExpenses),
        mortgageInterest: Math.round(mortgageInterest),
        propertyTax: Math.round(propertyTax),
        totalIncome: Math.round(totalIncome),
        totalWealth: Math.round(totalWealth)
      },
      taxes: {
        federalIncomeTax: Math.round(federalTax),
        cantonalIncomeTax: Math.round(cantonalTax),
        communalIncomeTax: Math.round(communalTax),
        totalIncomeTax: Math.round(totalIncomeTax),
        wealthTax: Math.round(wealthTax),
        withholdingTaxPaid: Math.round(withholdingTaxPaid),
        withholdingTaxCredit: Math.round(withholdingTaxPaid),
        totalTaxDue: Math.round(totalIncomeTax + wealthTax - withholdingTaxPaid)
      },
      rates,
      details: {
        investmentsCount: investments.length,
        realEstateCount: realEstate.length,
        rentalPropertiesCount: realEstate.filter(re => !re.is_primary_residence).length
      },
      timestamp: new Date().toISOString()
    };

    return Response.json(result);
  } catch (error) {
    console.error('Tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});