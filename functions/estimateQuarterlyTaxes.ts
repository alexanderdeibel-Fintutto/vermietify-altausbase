import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, projectedIncome } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch base calculation
    const calcs = await base44.entities.TaxCalculation.filter(
      { user_email: user.email, country, tax_year: taxYear },
      '-updated_date',
      1
    ).catch(() => []);

    const estimation = await base44.integrations.Core.InvokeLLM({
      prompt: `Estimate quarterly tax payments for ${country} taxpayer, tax year ${taxYear}.

Current Data:
- Base Total Tax: €${calcs[0]?.total_tax || 0}
- Projected Income: €${projectedIncome || 'not specified'}

Calculate quarterly breakdown:
1. Q1 (Jan-Mar): estimate
2. Q2 (Apr-Jun): estimate
3. Q3 (Jul-Sep): estimate
4. Q4 (Oct-Dec): estimate

Include:
- Quarterly payment amounts
- Tax rate applied
- Accumulated tax through year
- Payment due dates
- Safe harbor rules
- Penalty avoidance
- Adjustment recommendations`,
      response_json_schema: {
        type: 'object',
        properties: {
          q1_payment: { type: 'number' },
          q2_payment: { type: 'number' },
          q3_payment: { type: 'number' },
          q4_payment: { type: 'number' },
          total_estimated_tax: { type: 'number' },
          effective_tax_rate: { type: 'number' },
          payment_dates: { type: 'object', additionalProperties: { type: 'string' } },
          safe_harbor_notes: { type: 'array', items: { type: 'string' } },
          risk_alerts: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      estimation: {
        country,
        tax_year: taxYear,
        projected_income: projectedIncome,
        forecast: estimation
      }
    });
  } catch (error) {
    console.error('Estimate quarterly taxes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});