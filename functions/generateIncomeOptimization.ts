import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, totalIncome, incomeBreakdown } = await req.json();

    if (!country || !taxYear || !totalIncome) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Create comprehensive income optimization strategy for ${country}, year ${taxYear}.

Income Profile:
- Total Annual Income: €${Math.round(totalIncome)}
- Breakdown: ${incomeBreakdown ? JSON.stringify(incomeBreakdown) : 'Not specified'}

Provide:
1. Income splitting opportunities
2. Timing strategies (accrual vs cash basis)
3. Income deferral techniques
4. Business structure optimization
5. Passive vs active income strategies
6. Tax-advantaged account strategies
7. Income shifting to lower-income family members (where legal)
8. Estimated tax optimization
9. Withholding optimization
10. Quarterly income forecasting`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_situation: { type: 'object', additionalProperties: true },
          optimization_strategies: { type: 'array', items: { type: 'object', additionalProperties: true } },
          estimated_annual_savings: { type: 'number' },
          implementation_timeline: { type: 'array', items: { type: 'string' } },
          tax_efficiency_score: { type: 'number' },
          risks_and_considerations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      optimization: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: optimization
      }
    });
  } catch (error) {
    console.error('Generate income optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});