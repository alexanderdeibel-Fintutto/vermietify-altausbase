import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing taxYear' }, { status: 400 });
    }

    const investments = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
    const otherIncomes = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
    const capitalGains = await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [];

    // Calculate income components
    const capitalIncome = investments.reduce((s, i) => s + (i.gross_income || 0), 0);
    const capitalGainsTaxable = capitalGains.filter(c => !c.is_tax_exempt).reduce((s, c) => s + Math.max(0, c.gain_loss || 0), 0);
    const otherIncome = otherIncomes.reduce((s, o) => s + (o.amount || 0) - (o.deductible_expenses || 0), 0);
    const totalTaxableIncome = capitalIncome + capitalGainsTaxable + otherIncome;

    // Calculate withholding taxes
    const withholding = {
      kest: investments.reduce((s, i) => s + (i.withheld_tax_kest || 0), 0),
      church: investments.reduce((s, i) => s + (i.church_tax || 0), 0),
      otherWithheld: otherIncomes.reduce((s, o) => s + (o.withheld_tax || 0), 0)
    };

    const totalWithholding = withholding.kest + withholding.church + withholding.otherWithheld;

    // German tax rates (Ö perspective, simplified)
    const incomeTaxRate = 0.42; // Marginal rate estimate
    const solidarityTax = totalTaxableIncome * 0.055 * 0.05; // 5.5% of income tax

    // Calculate estimated income tax
    const estimatedIncomeTax = totalTaxableIncome * incomeTaxRate;
    const totalTax = estimatedIncomeTax + solidarityTax;

    // Calculate refund or payment
    const taxRefundOrPayment = totalWithholding - totalTax;

    return Response.json({
      summary: {
        taxable_income: totalTaxableIncome,
        total_tax: totalTax,
        withholding_tax_paid: totalWithholding,
        tax_refund_or_payment: taxRefundOrPayment
      },
      breakdown: {
        estimated_income_tax: estimatedIncomeTax,
        solidarity_tax: solidarityTax,
        total_tax: totalTax
      },
      income_components: {
        capital_income: capitalIncome,
        capital_gains: capitalGainsTaxable,
        other_income: otherIncome,
        total_income: totalTaxableIncome
      },
      withholding_breakdown: withholding,
      tax_year: taxYear,
      note: 'Dies ist eine Schätzung. Für präzise Berechnungen konsultieren Sie einen Steuerberater.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});