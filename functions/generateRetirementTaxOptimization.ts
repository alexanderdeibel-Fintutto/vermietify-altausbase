import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, currentAge, retirementAge, currentIncome, savedAmount } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const plan = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive retirement tax optimization plan for ${country}.

Profile:
- Tax Year: ${taxYear}
- Current Age: ${currentAge || 'Not specified'}
- Planned Retirement Age: ${retirementAge || 'Not specified'}
- Current Annual Income: €${Math.round(currentIncome || 0)}
- Retirement Savings: €${Math.round(savedAmount || 0)}

Provide optimization strategies:
1. Pension contribution optimization
2. Tax-deferred account strategies
3. Roth conversion opportunities
4. Required minimum distribution (RMD) planning
5. Social security tax optimization
6. Healthcare tax implications (Medicare, ACA)
7. State tax considerations in retirement
8. Income splitting strategies
9. Estate tax planning for heirs
10. Long-term tax-efficient withdrawal strategy
11. Estimated tax savings in retirement`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_situation: { type: 'object', additionalProperties: true },
          contribution_strategies: { type: 'array', items: { type: 'object', additionalProperties: true } },
          conversion_opportunities: { type: 'array', items: { type: 'string' } },
          withdrawal_strategy: { type: 'object', additionalProperties: true },
          estimated_annual_savings: { type: 'number' },
          action_timeline: { type: 'array', items: { type: 'string' } },
          critical_dates: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      optimization: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: plan
      }
    });
  } catch (error) {
    console.error('Generate retirement tax optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});