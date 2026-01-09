import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch investment and income data
    const [investments, otherIncome, calculations] = await Promise.all([
      base44.entities.Investment.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.OtherIncome.filter({ user_email: user.email, income_type: 'dividend' }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const totalDividends = otherIncome.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);

    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimize dividend strategy for ${country}, year ${taxYear}.

Current Dividend Income: €${Math.round(totalDividends)}
Investments: ${investments.length}
Total Tax: €${Math.round(totalTax)}

Provide dividend optimization strategies:
1. Dividend timing optimization
2. Tax-efficient dividend reinvestment
3. Qualified vs non-qualified dividend planning
4. Dividend stripping avoidance
5. Corporate structure optimization
6. Withholding tax optimization
7. Estimated annual savings
8. Implementation roadmap`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_position: { type: 'object', additionalProperties: true },
          optimization_strategies: { type: 'array', items: { type: 'object', additionalProperties: true } },
          timing_recommendations: { type: 'array', items: { type: 'string' } },
          estimated_annual_savings: { type: 'number' },
          withholding_optimization: { type: 'object', additionalProperties: true },
          compliance_requirements: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      optimization
    });
  } catch (error) {
    console.error('Optimize dividend strategy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});