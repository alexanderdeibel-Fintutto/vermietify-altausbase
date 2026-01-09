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

    // Fetch deadlines and filings
    const [deadlines, filings] = await Promise.all([
      base44.entities.TaxDeadline.filter({ country }).catch(() => []),
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const timeline = await base44.integrations.Core.InvokeLLM({
      prompt: `Create detailed tax filing timeline for ${country}, year ${taxYear}.

Available deadlines: ${deadlines.length}
Filing status: ${filings.length ? filings[0].status : 'not started'}

Generate comprehensive timeline with:
1. Document collection phase (dates, documents needed)
2. Calculation phase (timeline, dependencies)
3. Review phase (steps, checkpoints)
4. Filing phase (submission methods, confirmation)
5. Payment phase (due dates, payment methods)
6. Post-filing (follow-up actions, archiving)

Format as structured phases with milestones, durations, and action items.`,
      response_json_schema: {
        type: 'object',
        properties: {
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                start_date: { type: 'string' },
                end_date: { type: 'string' },
                duration_days: { type: 'number' },
                milestones: { type: 'array', items: { type: 'string' } },
                action_items: { type: 'array', items: { type: 'string' } },
                dependencies: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          critical_path: { type: 'array', items: { type: 'string' } },
          total_duration_days: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      timeline: {
        country,
        tax_year: taxYear,
        content: timeline,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create timeline error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});