import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, businessIncome, businessExpenses } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const income = businessIncome || 0;
    const expenses = businessExpenses || 0;
    const netIncome = income - expenses;

    const plan = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive self-employment tax plan for ${country}, year ${taxYear}.

Business Profile:
- Gross Income: €${Math.round(income)}
- Expenses: €${Math.round(expenses)}
- Net Income: €${Math.round(netIncome)}

Create detailed tax plan:
1. Self-employment tax calculation
2. Income tax planning
3. Home office deduction optimization
4. Vehicle & equipment depreciation
5. Health insurance deduction strategies
6. Retirement plan optimization (Solo 401k, SEP, etc.)
7. Quarterly estimated tax requirements
8. Entity structure recommendations
9. Expense categorization review
10. Tax savings opportunities`,
      response_json_schema: {
        type: 'object',
        properties: {
          self_employment_tax: { type: 'number' },
          estimated_income_tax: { type: 'number' },
          total_tax_liability: { type: 'number' },
          quarterly_estimates: { type: 'array', items: { type: 'number' } },
          deduction_opportunities: { type: 'array', items: { type: 'object', additionalProperties: true } },
          retirement_planning: { type: 'object', additionalProperties: true },
          entity_structure_recommendation: { type: 'string' },
          action_items: { type: 'array', items: { type: 'string' } },
          estimated_annual_savings: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      plan: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        income_summary: {
          gross_income: income,
          expenses: expenses,
          net_income: netIncome
        },
        content: plan
      }
    });
  } catch (error) {
    console.error('Generate self-employment tax plan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});