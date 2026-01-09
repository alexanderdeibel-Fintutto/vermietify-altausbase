import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, estimatedIncome, estimatedTax } = await req.json();

    if (!country || !taxYear || !estimatedTax) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const schedule = await base44.integrations.Core.InvokeLLM({
      prompt: `Create quarterly estimated tax payment schedule for ${country}, year ${taxYear}.

Tax Information:
- Estimated Annual Income: €${Math.round(estimatedIncome || 0)}
- Estimated Total Tax: €${Math.round(estimatedTax)}

Provide:
1. Quarterly payment amounts
2. Payment due dates for each quarter
3. Safe harbor rules (90% current/100% prior year)
4. Penalty calculation for underpayment
5. Payment methods available
6. Extension options
7. Tracking and record keeping
8. Adjustment strategies if income changes`,
      response_json_schema: {
        type: 'object',
        properties: {
          quarterly_payments: { type: 'array', items: { type: 'object', additionalProperties: true } },
          payment_schedule: { type: 'array', items: { type: 'string' } },
          safe_harbor_analysis: { type: 'object', additionalProperties: true },
          penalty_risk: { type: 'object', additionalProperties: true },
          payment_methods: { type: 'array', items: { type: 'string' } },
          tracking_checklist: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      schedule: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        metrics: {
          estimated_income: estimatedIncome,
          estimated_tax: estimatedTax,
          quarterly_amount: estimatedTax / 4
        },
        content: schedule
      }
    });
  } catch (error) {
    console.error('Calculate estimated tax payments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});