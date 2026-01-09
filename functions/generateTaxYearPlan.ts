import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, upcomingTaxYear } = await req.json();

    if (!country || !upcomingTaxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const plan = await base44.integrations.Core.InvokeLLM({
      prompt: `Create detailed tax year planning guide for ${country}, year ${upcomingTaxYear}.

Generate comprehensive plan covering:
1. Key tax deadlines (monthly breakdown)
2. Documentation to collect (categorized)
3. Tax-saving opportunities specific to ${country}
4. Quarterly reviews and adjustments
5. Monthly checklist
6. Estimated tax payments schedule
7. Record-keeping requirements
8. Year-end preparation timeline`,
      response_json_schema: {
        type: 'object',
        properties: {
          tax_year: { type: 'number' },
          country: { type: 'string' },
          quarterly_plan: { type: 'array', items: { type: 'object', additionalProperties: true } },
          monthly_checklist: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
          key_deadlines: { type: 'array', items: { type: 'object', additionalProperties: true } },
          documentation_needed: { type: 'array', items: { type: 'string' } },
          tax_saving_tips: { type: 'array', items: { type: 'string' } },
          estimated_tax_schedule: { type: 'array', items: { type: 'object', additionalProperties: true } }
        }
      }
    });

    return Response.json({
      status: 'success',
      plan
    });
  } catch (error) {
    console.error('Generate tax year plan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});