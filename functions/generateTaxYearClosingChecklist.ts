import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const checklist = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive year-end tax closing checklist for ${country}, year ${taxYear}.

Create detailed checklist covering:
1. Income documentation (all sources)
2. Expense documentation
3. Asset/investment reconciliation
4. Deduction verification
5. Estimated tax payment settlements
6. Form preparation
7. Filing deadline tracking
8. Record retention
9. Planning for next year
10. Professional review`,
      response_json_schema: {
        type: 'object',
        properties: {
          checklist_title: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                section_name: { type: 'string' },
                priority: { type: 'string' },
                deadline: { type: 'string' },
                items: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          critical_items: { type: 'array', items: { type: 'string' } },
          timeline: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } }
        }
      }
    });

    return Response.json({
      status: 'success',
      checklist
    });
  } catch (error) {
    console.error('Generate checklist error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});