import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, income, deductions, payments, filingStatus } = await req.json();

    if (!country || income === undefined) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const estimate = await base44.integrations.Core.InvokeLLM({
      prompt: `Calculate real-time tax estimate for ${country}.

Current Situation:
- Gross Income: €${Math.round(income)}
- Deductions: €${Math.round(deductions || 0)}
- Tax Payments Made: €${Math.round(payments || 0)}
- Filing Status: ${filingStatus || 'Individual'}

Provide:
1. Current year tax liability estimate
2. Remaining tax owed or refund due
3. Quarterly payment requirement
4. Safe harbor analysis
5. Estimated vs actual comparison
6. Withholding adjustment recommendations
7. Refund/payment timeline
8. Action items needed`,
      response_json_schema: {
        type: 'object',
        properties: {
          estimated_tax_liability: { type: 'number' },
          taxable_income: { type: 'number' },
          effective_tax_rate: { type: 'number' },
          taxes_paid_to_date: { type: 'number' },
          remaining_liability: { type: 'number' },
          quarterly_requirement: { type: 'number' },
          estimated_refund: { type: 'number' },
          action_items: { type: 'array', items: { type: 'string' } },
          payment_schedule: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      estimate: {
        country,
        generated_at: new Date().toISOString(),
        content: estimate
      }
    });
  } catch (error) {
    console.error('Calculate real-time tax estimate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});