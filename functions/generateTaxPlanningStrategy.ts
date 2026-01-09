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

    // Fetch historical tax data and current year data
    const [calculations, planning, scenarios] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }) || []
    ]);

    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Create comprehensive tax planning strategy for ${country} for tax year ${taxYear}.

Current Data:
- Projected Income: €${projectedIncome || 'Unknown'}
- Tax Calculations: ${calculations.length}
- Existing Plans: ${planning.length}
- Scenarios: ${scenarios.length}

Generate detailed strategy:
1. Income optimization opportunities
2. Deduction maximization strategies
3. Timing strategies (income/deductions)
4. Entity structure analysis
5. Investment timing strategies
6. Retirement contribution planning
7. Capital gain optimization
8. Expense categorization opportunities
9. Quarterly payment recommendations
10. Risk mitigation measures`,
      response_json_schema: {
        type: 'object',
        properties: {
          income_optimization: { type: 'array', items: { type: 'object', additionalProperties: true } },
          deduction_strategies: { type: 'array', items: { type: 'object', additionalProperties: true } },
          timing_strategies: { type: 'array', items: { type: 'string' } },
          quarterly_payments: { type: 'array', items: { type: 'object', additionalProperties: true } },
          estimated_tax_savings: { type: 'number' },
          implementation_timeline: { type: 'string' },
          key_decisions: { type: 'array', items: { type: 'string' } },
          risk_factors: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      strategy: {
        country,
        tax_year: taxYear,
        projected_income: projectedIncome,
        created_at: new Date().toISOString(),
        strategy: strategy
      }
    });
  } catch (error) {
    console.error('Generate tax planning strategy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});