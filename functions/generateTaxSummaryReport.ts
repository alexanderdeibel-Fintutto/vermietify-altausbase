import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear, countries = ['AT', 'CH', 'DE'] } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing taxYear' }, { status: 400 });
    }

    const report = {
      tax_year: taxYear,
      generated_at: new Date().toISOString(),
      user_email: user.email,
      summary: {},
      details: {}
    };

    // Austria
    if (countries.includes('AT')) {
      const investmentsAT = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
      const otherIncomesAT = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
      const capitalGainsAT = await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [];

      const kapitalErtrag = investmentsAT.reduce((s, i) => s + (i.gross_income || 0), 0);
      const sonstigEinkUnfte = otherIncomesAT.reduce((s, o) => s + (o.amount || 0), 0);
      const veraeusserungsgewinne = capitalGainsAT.filter(c => !c.is_tax_exempt).reduce((s, c) => s + Math.max(0, c.gain_loss || 0), 0);
      const withholding = investmentsAT.reduce((s, i) => s + (i.withheld_tax_kest || 0), 0);

      report.summary.AT = {
        total_income: kapitalErtrag + sonstigEinkUnfte + veraeusserungsgewinne,
        capital_income: kapitalErtrag,
        other_income: sonstigEinkUnfte,
        capital_gains: veraeusserungsgewinne,
        withholding_tax: withholding,
        entries: {
          investments: investmentsAT.length,
          other_incomes: otherIncomesAT.length,
          capital_gains: capitalGainsAT.length
        }
      };

      report.details.AT = {
        investments: investmentsAT,
        other_incomes: otherIncomesAT,
        capital_gains: capitalGainsAT
      };
    }

    // Switzerland (default ZH)
    if (countries.includes('CH')) {
      const investmentsCH = await base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton: 'ZH' }) || [];
      const realEstateCH = await base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton: 'ZH' }) || [];
      const capitalGainsCH = await base44.entities.CapitalGainCH.filter({ tax_year: taxYear, canton: 'ZH' }) || [];

      const dividends = investmentsCH.reduce((s, i) => s + (i.dividend_income || 0), 0);
      const interest = investmentsCH.reduce((s, i) => s + (i.interest_income || 0), 0);
      const rentalIncome = realEstateCH.reduce((s, r) => s + (r.rental_income || 0), 0);
      const gains = capitalGainsCH.reduce((s, c) => s + (c.capital_gain || 0), 0);

      report.summary.CH = {
        total_income: dividends + interest + rentalIncome + gains,
        dividend_income: dividends,
        interest_income: interest,
        rental_income: rentalIncome,
        capital_gains: gains,
        entries: {
          securities: investmentsCH.length,
          real_estate: realEstateCH.length,
          capital_gains: capitalGainsCH.length
        }
      };

      report.details.CH = {
        securities: investmentsCH,
        real_estate: realEstateCH,
        capital_gains: capitalGainsCH
      };
    }

    // Germany
    if (countries.includes('DE')) {
      const investmentsDE = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
      const otherIncomesDE = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
      const capitalGainsDE = await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [];

      const kapitalErtrag = investmentsDE.reduce((s, i) => s + (i.gross_income || 0), 0);
      const sonstigeEinkUnfte = otherIncomesDE.reduce((s, o) => s + (o.amount || 0), 0);
      const veraeusserungsgewinne = capitalGainsDE.filter(c => !c.is_tax_exempt).reduce((s, c) => s + Math.max(0, c.gain_loss || 0), 0);
      const withholding = investmentsDE.reduce((s, i) => s + (i.withheld_tax_kest || 0), 0);

      report.summary.DE = {
        total_income: kapitalErtrag + sonstigeEinkUnfte + veraeusserungsgewinne,
        capital_income: kapitalErtrag,
        other_income: sonstigeEinkUnfte,
        capital_gains: veraeusserungsgewinne,
        withholding_tax: withholding,
        entries: {
          investments: investmentsDE.length,
          other_incomes: otherIncomesDE.length,
          capital_gains: capitalGainsDE.length
        }
      };

      report.details.DE = {
        investments: investmentsDE,
        other_incomes: otherIncomesDE,
        capital_gains: capitalGainsDE
      };
    }

    // Calculate global totals
    const globalIncome = Object.values(report.summary).reduce((s, c) => s + (c.total_income || 0), 0);
    const totalEntries = Object.values(report.summary).reduce((s, c) => {
      const entryCount = Object.values(c.entries || {}).reduce((a, b) => a + b, 0);
      return s + entryCount;
    }, 0);

    report.global_summary = {
      total_income: globalIncome,
      countries_included: countries.length,
      total_entries: totalEntries,
      countries: countries
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});