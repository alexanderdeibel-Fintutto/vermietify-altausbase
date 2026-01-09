import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, years = 3 } = await req.json();
    const currentYear = new Date().getFullYear();

    // Lade Kalkulationen der letzten N Jahre
    const calculations = await base44.entities.TaxCalculation.filter({
      user_email: user.email,
      country
    }, '-tax_year', years);

    // Multi-Year Trend Analysis
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere ${years}-Jahre Tax Trends für ${user.email} in ${country}:

HISTORICAL DATA:
${JSON.stringify(calculations.map(c => ({
  year: c.tax_year,
  total_tax: c.total_tax,
  withholding_paid: c.withholding_tax_paid,
  refund: c.tax_refund_or_payment
})), null, 2)}

ANALYSIERE:
1. Year-over-Year Tax Changes
2. Income Trend & Volatility
3. Deduction Trends
4. Effective Tax Rate Evolution
5. Withholding Adequacy
6. Refund Patterns
7. Tax Debt Accumulation Risk
8. Estimated Next Year Tax

FORECAST NEXT YEAR:
- Based on historical trends
- Risk assessment
- Recommended actions`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          average_annual_tax: { type: "number" },
          tax_trend: { type: "string", enum: ["increasing", "stable", "decreasing"] },
          average_effective_rate: { type: "number" },
          volatility_score: { type: "number" },
          forecast_next_year: { type: "number" },
          risk_indicators: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      years_analyzed: years,
      analysis
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});