import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, businessType } = await req.json();

    const automation = await base44.integrations.Core.InvokeLLM({
      prompt: `Create intelligent tax automation rules for ${country}, business type: ${businessType || 'individual'}.

Provide automation workflows for:
1. Automatic receipt categorization
2. Bank transaction matching
3. Quarterly estimated tax payments
4. Document gathering reminders
5. Deadline notifications
6. Deduction identification
7. Reconciliation workflows
8. Report generation schedules`,
      response_json_schema: {
        type: 'object',
        properties: {
          automation_rules: { type: 'array', items: { type: 'object', additionalProperties: true } },
          workflows: { type: 'array', items: { type: 'object', additionalProperties: true } },
          triggers: { type: 'array', items: { type: 'string' } },
          estimated_time_savings: { type: 'number' },
          implementation_steps: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      automation: {
        country,
        business_type: businessType,
        generated_at: new Date().toISOString(),
        content: automation
      }
    });
  } catch (error) {
    console.error('Generate tax automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});