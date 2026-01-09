import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, businessType, businessIncome, businessExpenses } = await req.json();

    if (!country || !taxYear || !businessType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const planning = await base44.integrations.Core.InvokeLLM({
      prompt: `Create entity/business tax planning strategy for ${country}, year ${taxYear}.

Business Profile:
- Entity Type: ${businessType}
- Annual Income: €${Math.round(businessIncome || 0)}
- Annual Expenses: €${Math.round(businessExpenses || 0)}

Provide:
1. Entity structure optimization (S-Corp, C-Corp, LLC, Partnership, etc.)
2. Profit-sharing and distribution strategy
3. Tax-deferred compensation opportunities
4. Entity tax liability calculation
5. Self-employment tax optimization
6. Estimated quarterly tax payments
7. Deductible business expenses checklist
8. Entity-level tax credits and incentives
9. Payroll tax optimization
10. Year-end tax planning recommendations`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_structure_analysis: { type: 'object', additionalProperties: true },
          alternative_structures: { type: 'array', items: { type: 'object', additionalProperties: true } },
          optimal_structure: { type: 'string' },
          estimated_tax_liability: { type: 'number' },
          annual_savings_estimate: { type: 'number' },
          action_items: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      planning: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: planning
      }
    });
  } catch (error) {
    console.error('Generate entity tax planning error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});