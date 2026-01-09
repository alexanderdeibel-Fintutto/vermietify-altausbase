import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { taxYear, country, format = 'json' } = await req.json();

    console.log(`Generating wealth report for ${country}/${taxYear}`);

    // Fetch all relevant data
    const [investments, realEstates, otherIncomes, capitalGains] = await Promise.all([
      country === 'AT'
        ? base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
        : base44.entities.InvestmentCH.filter({ tax_year: taxYear }) || [],
      country === 'AT'
        ? base44.entities.RealEstate.filter({ tax_year: taxYear }) || []
        : base44.entities.RealEstateCH.filter({ tax_year: taxYear }) || [],
      country === 'AT'
        ? base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || []
        : base44.entities.OtherIncomeCH.filter({ tax_year: taxYear }) || [],
      base44.entities.CapitalGain.filter({ tax_year: taxYear }) || []
    ]);

    // Calculate totals
    const investmentValue = investments.reduce((s, i) => {
      if (country === 'AT') {
        return s + (i.gross_income || 0);
      } else {
        return s + ((i.current_value || 0) * (i.quantity || 1));
      }
    }, 0);

    const realEstateValue = realEstates.reduce((s, r) => {
      if (country === 'AT') {
        return s + (r.current_market_value || 0);
      } else {
        return s + (r.current_market_value || 0);
      }
    }, 0);

    const otherIncomeTotal = otherIncomes.reduce((s, i) => s + (i.amount || 0), 0);
    const capitalGainTotal = capitalGains.reduce((s, c) => s + (c.gain_loss || 0), 0);

    const totalWealth = investmentValue + realEstateValue;
    const totalIncome = investmentValue + otherIncomeTotal + capitalGainTotal;

    const report = {
      year: taxYear,
      country,
      generated_at: new Date().toISOString(),
      summary: {
        total_wealth: totalWealth,
        total_income: totalIncome,
        investment_value: investmentValue,
        real_estate_value: realEstateValue,
        other_income: otherIncomeTotal,
        capital_gains: capitalGainTotal
      },
      breakdown: {
        investments: investments.length,
        real_estates: realEstates.length,
        other_incomes: otherIncomes.length,
        capital_gains: capitalGains.length
      },
      composition: {
        investments_percent: (investmentValue / totalWealth * 100).toFixed(2),
        real_estate_percent: (realEstateValue / totalWealth * 100).toFixed(2)
      }
    };

    if (format === 'csv') {
      const csv = `
Wealth Report ${taxYear} - ${country}
Generated: ${new Date().toLocaleDateString()}

Summary
Total Wealth,${totalWealth}
Total Income,${totalIncome}
Investment Value,${investmentValue}
Real Estate Value,${realEstateValue}

Composition
Investments,${(investmentValue / totalWealth * 100).toFixed(2)}%
Real Estate,${(realEstateValue / totalWealth * 100).toFixed(2)}%
      `.trim();

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wealth_report_${country}_${taxYear}.csv"`
        }
      });
    }

    return Response.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});