import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country } = await req.json();

    if (!country) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch recent tax law updates
    const updates = await base44.entities.TaxLawUpdate.filter({ 
      country, 
      is_active: true 
    }, '-published_date', 20).catch(() => []);

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze tax law changes for ${country} and their impact.

Recent Updates: ${updates.length}

For each update, provide:
1. Change summary
2. Impact on individual taxpayers
3. Impact on businesses
4. Effective date
5. Action required
6. Risk if not compliant
7. Opportunities`,
      response_json_schema: {
        type: 'object',
        properties: {
          recent_changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                impact: { type: 'string' },
                individual_impact: { type: 'string' },
                business_impact: { type: 'string' },
                action_required: { type: 'array', items: { type: 'string' } },
                effective_date: { type: 'string' }
              }
            }
          },
          critical_changes: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } },
          compliance_checklist: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      monitoring: {
        country,
        total_updates: updates.length,
        analysis
      }
    });
  } catch (error) {
    console.error('Monitor tax law changes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});