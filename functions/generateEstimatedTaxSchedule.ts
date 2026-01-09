import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, estimatedTaxLiability, taxYear } = await req.json();

    if (!country || !estimatedTaxLiability) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const schedule = await base44.integrations.Core.InvokeLLM({
      prompt: `Create estimated tax payment schedule for ${country}, year ${taxYear || new Date().getFullYear()}.

Estimated Tax Liability: €${Math.round(estimatedTaxLiability)}

Provide:
1. Quarterly payment amounts
2. Payment due dates
3. Safe harbor requirements
4. Penalties for underpayment
5. Safe harbor calculations
6. Installment options
7. Extension procedures
8. Payment methods`,
      response_json_schema: {
        type: 'object',
        properties: {
          quarterly_payments: { type: 'array', items: { type: 'object', additionalProperties: true } },
          total_annual: { type: 'number' },
          safe_harbor_amount: { type: 'number' },
          safe_harbor_met: { type: 'boolean' },
          underpayment_penalty: { type: 'number' },
          payment_schedule: { type: 'array', items: { type: 'string' } },
          extension_option: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      schedule: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: schedule
      }
    });
  } catch (error) {
    console.error('Generate estimated tax schedule error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});