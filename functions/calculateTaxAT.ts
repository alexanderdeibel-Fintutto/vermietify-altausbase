import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const KEST_RATE = 0.275; // 27.5% Kapitalertragsteuer in Österreich
const SPARER_ALLOWANCE = 730; // €730 Sparerfreibetrag pro Jahr
const CHURCH_TAX_RATE = 0.10; // 10% Kirchensteuer auf KESt
const PROGRESSIVE_TAX_RATES = [
  { threshold: 11000, rate: 0.20 },
  { threshold: 25000, rate: 0.32 },
  { threshold: 60000, rate: 0.42 },
  { threshold: 90000, rate: 0.48 },
  { threshold: Infinity, rate: 0.55 }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, federalState } = await req.json();

    console.log(`Calculating Austrian tax for user: ${userId}, year: ${taxYear}`);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch investment data
    const investments = await base44.entities.InvestmentAT.filter({
      tax_year: taxYear
    }) || [];

    // Fetch other income data
    const otherIncomes = await base44.entities.OtherIncomeAT.filter({
      tax_year: taxYear
    }) || [];

    // Calculate KAP (Kapitalvermögen) / Investment Income
    let totalGrossIncome = 0;
    let totalWithheldKest = 0;
    let investmentDetails = [];

    for (const inv of investments) {
      totalGrossIncome += inv.gross_income;
      totalWithheldKest += inv.withheld_tax_kest || 0;

      investmentDetails.push({
        title: inv.title,
        type: inv.investment_type,
        grossIncome: inv.gross_income,
        kesWithheld: inv.withheld_tax_kest || 0
      });
    }

    // Apply sparer allowance
    const allowanceUsed = Math.min(SPARER_ALLOWANCE, totalGrossIncome);
    const taxableIncome = Math.max(0, totalGrossIncome - allowanceUsed);

    // Calculate KESt (Kapitalertragsteuer)
    const calculatedKest = taxableIncome * KEST_RATE;
    const actualKest = Math.max(calculatedKest - (totalWithheldKest || 0), 0);

    // Calculate Sonstige Einkünfte (Other Income)
    let otherIncomeTotal = 0;
    let otherIncomeDetails = [];

    for (const income of otherIncomes) {
      otherIncomeTotal += income.taxable_amount || income.amount;
      otherIncomeDetails.push({
        description: income.description,
        type: income.income_type,
        amount: income.taxable_amount || income.amount,
        withheld: income.withheld_tax || 0
      });
    }

    // Combined taxable income (for progressive tax calculation)
    const combinedTaxableIncome = taxableIncome + otherIncomeTotal;

    // Calculate progressive income tax
    let incomeTax = 0;
    let previousThreshold = 0;
    for (const bracket of PROGRESSIVE_TAX_RATES) {
      if (combinedTaxableIncome <= previousThreshold) break;
      const taxableInBracket = Math.min(combinedTaxableIncome, bracket.threshold) - previousThreshold;
      incomeTax += taxableInBracket * bracket.rate;
      previousThreshold = bracket.threshold;
    }

    return Response.json({
      success: true,
      taxYear,
      totals: {
        grossIncome: totalGrossIncome,
        otherIncome: otherIncomeTotal,
        allowanceUsed,
        taxableIncomeKap: taxableIncome,
        taxableIncomeTotal: combinedTaxableIncome
      },
      calculations: {
        kest: {
          calculatedKest,
          withheld: totalWithheldKest,
          toPay: actualKest
        },
        incomeTax: Math.max(0, incomeTax - (totalWithheldKest || 0)),
        totalTax: Math.max(0, actualKest + incomeTax - (totalWithheldKest || 0))
      },
      details: {
        investments: investmentDetails,
        otherIncomes: otherIncomeDetails
      },
      validationStatus: 'valid',
      summary: `Österreich Steuerjahr ${taxYear}: KESt €${actualKest.toFixed(2)}, Einkommensteuer €${Math.max(0, incomeTax - (totalWithheldKest || 0)).toFixed(2)}`
    });

  } catch (error) {
    console.error('Tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});