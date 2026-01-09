import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, pensionIncome, otherIncome, age, maritalStatus } = await req.json();

    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimize retirement income tax for ${country}.

Situation:
- Pension Income: €${Math.round(pensionIncome || 0)}
- Other Income: €${Math.round(otherIncome || 0)}
- Age: ${age}
- Marital Status: ${maritalStatus}

Provide:
1. Taxable vs non-taxable portions
2. Standard vs itemized deductions
3. Special retiree deductions available
4. Timing strategies for income
5. Spouse income optimization
6. Social security impact
7. Healthcare tax implications
8. Multi-year tax planning
9. Estimated annual tax requirement`,
      response_json_schema: {
        type: 'object',
        properties: {
          total_taxable_income: { type: 'number' },
          estimated_tax_liability: { type: 'number' },
          available_deductions: { type: 'array', items: { type: 'object', additionalProperties: true } },
          optimization_strategies: { type: 'array', items: { type: 'string' } },
          income_timing_plan: { type: 'object', additionalProperties: true },
          potential_savings: { type: 'number' },
          action_items: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      optimization: {
        country,
        pension_income: pensionIncome,
        generated_at: new Date().toISOString(),
        content: optimization
      }
    });
  } catch (error) {
    console.error('Optimize retirement income tax error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});