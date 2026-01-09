import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, grossIncome } = await req.json();

    if (!country || !taxYear || !grossIncome) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const deductions = await base44.integrations.Core.InvokeLLM({
      prompt: `Create comprehensive deduction maximization strategy for ${country}, year ${taxYear}.

Income Profile:
- Gross Income: €${Math.round(grossIncome)}

Provide:
1. Itemized vs standard deduction analysis
2. Above-the-line deductions checklist
3. Business expense deduction opportunities
4. Charitable contribution strategies
5. Medical expense deduction planning
6. Property tax and mortgage interest optimization
7. Education-related deductions
8. Investment expense deductions
9. Home office deduction guidance
10. Bunching deductions strategy
11. Estimated deduction amount
12. Documentation requirements`,
      response_json_schema: {
        type: 'object',
        properties: {
          standard_vs_itemized: { type: 'object', additionalProperties: true },
          available_deductions: { type: 'array', items: { type: 'object', additionalProperties: true } },
          estimated_total_deductions: { type: 'number' },
          recommended_deduction_approach: { type: 'string' },
          estimated_tax_savings: { type: 'number' },
          documentation_checklist: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      strategy: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: deductions
      }
    });
  } catch (error) {
    console.error('Generate deduction maximization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});