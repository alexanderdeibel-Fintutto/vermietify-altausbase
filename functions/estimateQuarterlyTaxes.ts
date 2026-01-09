import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, projectedIncome } = await req.json();

    if (!country || !taxYear || !projectedIncome) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch previous tax data
    const prevYearCalcs = await base44.entities.TaxCalculation.filter({
      user_email: user.email,
      country,
      tax_year: taxYear - 1
    }) || [];

    const prevTotalTax = prevYearCalcs.reduce((sum, c) => sum + (c.total_tax || 0), 0);

    const estimates = await base44.integrations.Core.InvokeLLM({
      prompt: `Calculate quarterly tax payment estimates for ${country} taxpayer.

Parameters:
- Tax Year: ${taxYear}
- Projected Annual Income: €${Math.round(projectedIncome)}
- Previous Year Total Tax: €${Math.round(prevTotalTax)}

Provide:
1. Quarterly payment schedule
2. Payment amounts per quarter
3. Cumulative payments
4. Due dates per jurisdiction
5. Late payment penalties if missed
6. Adjustment recommendations mid-year
7. Extension options
8. Risk of overpayment/underpayment`,
      response_json_schema: {
        type: 'object',
        properties: {
          quarterly_payments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                quarter: { type: 'number' },
                period: { type: 'string' },
                payment_amount: { type: 'number' },
                due_date: { type: 'string' },
                cumulative_amount: { type: 'number' }
              }
            }
          },
          total_estimated_tax: { type: 'number' },
          estimated_effective_rate: { type: 'number' },
          adjustment_scenarios: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      estimates: {
        country,
        tax_year: taxYear,
        projected_income: projectedIncome,
        generated_at: new Date().toISOString(),
        schedule: estimates
      }
    });
  } catch (error) {
    console.error('Estimate quarterly taxes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});