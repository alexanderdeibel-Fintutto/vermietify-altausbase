import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Calculating AT taxes for ${taxYear}`);

    // Fetch all AT tax data
    const [investments, otherIncomes, capitalGains] = await Promise.all([
      base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [],
      base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [],
      base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || []
    ]);

    // Austrian tax rates 2026
    const KEST_RATE = 0.275; // 27.5% Kapitalertragsteuer
    const CHURCH_TAX_RATE = 0.03; // 3% Kirchensteuer (Oberösterreich)
    const SPARER_ALLOWANCE = 730; // EUR

    // Calculate capital gains (Kapitalvermögen)
    let capitalGross = 0;
    let kestWithheld = 0;
    let churchTaxWithheld = 0;
    let foreignTaxCredit = 0;

    for (const inv of investments) {
      capitalGross += inv.gross_income || 0;
      kestWithheld += inv.withheld_tax_kest || 0;
      churchTaxWithheld += inv.church_tax || 0;
      foreignTaxCredit += inv.foreign_tax || 0;
    }

    // Apply sparer allowance
    const capitalAfterAllowance = Math.max(0, capitalGross - SPARER_ALLOWANCE);
    const capitalTaxable = capitalAfterAllowance;

    // Calculate other income (Sonstige Einkünfte)
    const otherIncome = otherIncomes.reduce((sum, oi) => {
      const taxable = (oi.amount || 0) - (oi.deductible_expenses || 0);
      return sum + Math.max(0, taxable);
    }, 0);

    // Capital gains tax (Veräußerungsgewinne)
    let capitalGainTaxable = 0;
    for (const cg of capitalGains) {
      if (cg.is_tax_exempt) continue;
      capitalGainTaxable += cg.gain_loss || 0;
    }

    // Total taxable income
    const totalTaxableIncome = capitalTaxable + otherIncome + capitalGainTaxable;

    // Simplified tax calculation (progressive rates)
    let incomeTax = 0;
    if (totalTaxableIncome > 75000) {
      incomeTax = (75000 * 0.32) + ((totalTaxableIncome - 75000) * 0.42);
    } else if (totalTaxableIncome > 30000) {
      incomeTax = (30000 * 0.25) + ((totalTaxableIncome - 30000) * 0.32);
    } else {
      incomeTax = totalTaxableIncome * 0.20;
    }

    // Tax credits
    const totalWithheld = kestWithheld + churchTaxWithheld;
    const taxableAfterCredits = Math.max(0, incomeTax - totalWithheld - foreignTaxCredit);

    const result = {
      taxYear,
      summary: {
        capitalGainIncome: capitalGross,
        sparerAllowanceUsed: Math.min(SPARER_ALLOWANCE, capitalGross),
        capitalTaxable,
        otherIncome,
        capitalGainsTaxable: capitalGainTaxable,
        totalTaxableIncome
      },
      taxes: {
        estimatedIncomeTax: Math.round(incomeTax),
        kestWithheld: Math.round(kestWithheld),
        churchTaxWithheld: Math.round(churchTaxWithheld),
        foreignTaxCredit: Math.round(foreignTaxCredit),
        totalWithheld: Math.round(totalWithheld),
        taxDue: Math.round(taxableAfterCredits),
        taxableAfterCredits: Math.round(taxableAfterCredits)
      },
      details: {
        investmentsCount: investments.length,
        otherIncomesCount: otherIncomes.length,
        capitalGainsCount: capitalGains.filter(cg => !cg.is_tax_exempt).length,
        exemptCapitalGains: capitalGains.filter(cg => cg.is_tax_exempt).length
      },
      timestamp: new Date().toISOString()
    };

    return Response.json(result);
  } catch (error) {
    console.error('Tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});