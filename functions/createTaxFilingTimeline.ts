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

    // Fetch deadlines
    const deadlines = await base44.entities.TaxDeadline.filter({
      country,
      tax_year: taxYear,
      is_active: true
    }, '-deadline_date') || [];

    const timeline = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a filing timeline for ${country} taxpayer, tax year ${taxYear}.

Deadlines Found: ${deadlines.length}
${deadlines.slice(0, 5).map(d => `- ${d.title}: ${d.deadline_date}`).join('\n')}

Generate:
1. Chronological filing schedule
2. Preparation phases with timelines
3. Document collection milestones
4. Filing coordination steps
5. Post-filing actions
6. Buffer time recommendations
7. Critical dates highlighting
8. Contingency dates if missed`,
      response_json_schema: {
        type: 'object',
        properties: {
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                phase: { type: 'string' },
                start_date: { type: 'string' },
                end_date: { type: 'string' },
                tasks: { type: 'array', items: { type: 'string' } },
                priority: { type: 'string' }
              }
            }
          },
          critical_dates: { type: 'array', items: { type: 'string' } },
          buffer_days: { type: 'number' },
          contingencies: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      timeline: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        deadlines_count: deadlines.length,
        schedule: timeline
      }
    });
  } catch (error) {
    console.error('Create timeline error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});