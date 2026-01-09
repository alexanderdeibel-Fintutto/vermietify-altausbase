import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, yearToDateIncome, yearToDateExpenses, estimatedFullYearIncome } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const estimation = await base44.integrations.Core.InvokeLLM({
      prompt: `Estimate quarterly taxes for ${country}, year ${taxYear}.

YTD Information:
- Income so far: €${yearToDateIncome || 0}
- Expenses so far: €${yearToDateExpenses || 0}
- Estimated full-year income: €${estimatedFullYearIncome || 0}

Generate quarterly tax estimation with:
1. Q1-Q4 projected tax liability
2. Recommended quarterly payment amounts
3. Payment deadlines per quarter
4. Cumulative progression
5. Adjustment recommendations
6. Year-end reconciliation estimate
7. Withholding tax considerations`,
      response_json_schema: {
        type: 'object',
        properties: {
          quarterly_estimates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                quarter: { type: 'string' },
                estimated_tax: { type: 'number' },
                payment_amount: { type: 'number' },
                due_date: { type: 'string' },
                cumulative_paid: { type: 'number' }
              }
            }
          },
          full_year_projection: { type: 'number' },
          total_withholding: { type: 'number' },
          balance_at_year_end: { type: 'number' },
          adjustments_needed: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      estimation
    });
  } catch (error) {
    console.error('Quarterly tax estimation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});