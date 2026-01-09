import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, income, expenses = {}, assets = {} } = await req.json();

    if (!country || !taxYear || !income) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Provide advanced tax deduction optimization for ${country}, year ${taxYear}.

Profile:
- Income: €${income}
- Expenses: ${JSON.stringify(expenses)}
- Assets: ${JSON.stringify(assets)}

Analyze:
1. All eligible deductions per country law
2. Often-missed deduction opportunities
3. Timing strategies (current/future year)
4. Capital loss harvesting potential
5. Business structure optimization
6. Estimated tax savings
7. Risk assessment
8. Implementation roadmap`,
      response_json_schema: {
        type: 'object',
        properties: {
          available_deductions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                current_amount: { type: 'number' },
                optimized_amount: { type: 'number' },
                potential_savings: { type: 'number' },
                implementation: { type: 'string' }
              }
            }
          },
          overlooked_opportunities: { type: 'array', items: { type: 'string' } },
          total_potential_deductions: { type: 'number' },
          estimated_tax_savings: { type: 'number' },
          effective_tax_rate_before: { type: 'number' },
          effective_tax_rate_after: { type: 'number' },
          risk_level: { type: 'string' },
          implementation_steps: { type: 'array', items: { type: 'string' } },
          next_year_strategies: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      optimization: {
        country,
        tax_year: taxYear,
        baseline_income: income,
        analysis: optimization
      }
    });
  } catch (error) {
    console.error('Optimize deductions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});