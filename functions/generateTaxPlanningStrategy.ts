import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, projectedIncome } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch user tax data
    const [calcs, planning, scenarios] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 3).catch(() => []),
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 2).catch(() => [])
    ]);

    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate personalized tax planning strategy for ${country} taxpayer.

Current Data:
- Current Tax: €${calcs[0]?.total_tax || 0}
- Projected Income: €${projectedIncome || 'not specified'}
- Active Planning Items: ${planning.length}
- Analyzed Scenarios: ${scenarios.length}

Create strategy with:
1. Income optimization recommendations
2. Deduction maximization opportunities
3. Quarterly payment plan
4. Monthly savings target
5. Risk-adjusted recommendations
6. Timeline for implementation`,
      response_json_schema: {
        type: 'object',
        properties: {
          income_strategies: { type: 'array', items: { type: 'string' } },
          deduction_opportunities: { type: 'array', items: { type: 'object', additionalProperties: true } },
          quarterly_plan: { type: 'object', additionalProperties: { type: 'number' } },
          monthly_savings_target: { type: 'number' },
          risk_level: { type: 'string' },
          estimated_savings: { type: 'number' },
          implementation_timeline: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      strategy: {
        country,
        tax_year: taxYear,
        projected_income: projectedIncome,
        plan: strategy
      }
    });
  } catch (error) {
    console.error('Generate tax strategy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});