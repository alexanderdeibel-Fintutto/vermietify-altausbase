import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, totalExpenses } = await req.json();

    if (!country || !taxYear || !totalExpenses) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze and categorize business expenses for tax purposes in ${country}, year ${taxYear}.

Total Expenses: €${Math.round(totalExpenses)}

Provide:
1. Deductible vs non-deductible breakdown
2. Category-wise expense breakdown
3. Estimated tax savings
4. Common missed deductions
5. Documentation requirements per category
6. Red flags for audit risk
7. Strategies to maximize deductions
8. Record-keeping recommendations
9. Quarterly tracking plan`,
      response_json_schema: {
        type: 'object',
        properties: {
          deductible_summary: { type: 'object', additionalProperties: true },
          expense_categories: { type: 'array', items: { type: 'object', additionalProperties: true } },
          missed_deductions: { type: 'array', items: { type: 'string' } },
          estimated_tax_savings: { type: 'number' },
          documentation_guide: { type: 'object', additionalProperties: true },
          red_flags: { type: 'array', items: { type: 'string' } },
          optimization_tips: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      analysis: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: analysis
      }
    });
  } catch (error) {
    console.error('Generate smart expense analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});