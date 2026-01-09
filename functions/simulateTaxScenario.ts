import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scenario } = await req.json();

    if (!scenario) {
      return Response.json({ error: 'Missing scenario' }, { status: 400 });
    }

    const { country, taxYear, parameters } = scenario;

    // Base scenario calculation
    const baseIncome = parameters.base_income || 0;
    const baseInvestments = parameters.base_investments || 0;
    const adjustedIncome = parameters.adjusted_income || baseIncome;
    const adjustedInvestments = parameters.adjusted_investments || baseInvestments;

    // Country-specific calculations
    const calculations = {
      AT: {
        income_tax_rate: 0.42,
        capital_gains_tax: 0.275,
        wealth_tax_rate: 0,
        calculate: (income, investments, wealth) => ({
          income_tax: income * 0.42,
          capital_gains_tax: investments * 0.275,
          wealth_tax: 0,
          total: (income * 0.42) + (investments * 0.275)
        })
      },
      CH: {
        income_tax_rate: 0.22,
        capital_gains_tax: 0,
        wealth_tax_rate: 0.001,
        calculate: (income, investments, wealth) => ({
          income_tax: income * 0.22,
          capital_gains_tax: 0,
          wealth_tax: wealth * 0.001,
          total: (income * 0.22) + (wealth * 0.001)
        })
      },
      DE: {
        income_tax_rate: 0.42,
        capital_gains_tax: 0.26375,
        wealth_tax_rate: 0,
        calculate: (income, investments, wealth) => ({
          income_tax: income * 0.42,
          capital_gains_tax: investments * 0.26375,
          wealth_tax: 0,
          total: (income * 0.42) + (investments * 0.26375)
        })
      }
    };

    const calc = calculations[country];
    if (!calc) {
      return Response.json({ error: 'Unsupported country' }, { status: 400 });
    }

    // Calculate base scenario
    const baseTax = calc.calculate(baseIncome, baseInvestments, parameters.wealth || 0);
    const adjustedTax = calc.calculate(adjustedIncome, adjustedInvestments, parameters.wealth || 0);

    const impact = {
      income_change: adjustedIncome - baseIncome,
      investment_change: adjustedInvestments - baseInvestments,
      tax_change: adjustedTax.total - baseTax.total,
      tax_savings_percentage: ((baseTax.total - adjustedTax.total) / baseTax.total * 100).toFixed(2),
      effective_rate_base: (baseTax.total / (baseIncome + baseInvestments) * 100).toFixed(2),
      effective_rate_adjusted: (adjustedTax.total / (adjustedIncome + adjustedInvestments) * 100).toFixed(2)
    };

    // Determine risk level
    let risk_level = 'low';
    if (adjustedTax.total < baseTax.total * 0.7) {
      risk_level = 'high'; // Aggressive optimization
    } else if (adjustedTax.total < baseTax.total * 0.85) {
      risk_level = 'medium';
    }

    // Generate recommendations
    const recommendations = [];
    if (impact.tax_savings_percentage > 20) {
      recommendations.push('Hohe Einsparungen erkannt - Konsultieren Sie einen Steuerberater zur Validierung');
    }
    if (risk_level === 'high') {
      recommendations.push('Dieses Szenario birgt erhöhtes Revisionsrisiko - Dokumentation ist entscheidend');
    }
    recommendations.push('Überprüfen Sie alle Annahmen mit aktuellen Steuertarife');

    return Response.json({
      status: 'success',
      scenario_id: Math.random().toString(36).substr(2, 9),
      country,
      tax_year: taxYear,
      base_calculation: baseTax,
      adjusted_calculation: adjustedTax,
      impact,
      risk_level,
      recommendations,
      feasibility_score: Math.max(30, Math.min(100, 100 - (risk_level === 'high' ? 30 : risk_level === 'medium' ? 15 : 0)))
    });
  } catch (error) {
    console.error('Tax scenario simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});