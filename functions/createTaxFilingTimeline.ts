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

    // Fetch filing and compliance data
    const [filing, compliance, documents, deadlines] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDeadline.filter({ country }).catch(() => [])
    ]);

    const timeline = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a detailed filing timeline for ${country} tax year ${taxYear}.

Current Status:
- Filing Status: ${filing.length > 0 ? filing[0].status : 'Not started'}
- Compliance Items: ${compliance.length}
- Documents: ${documents.length}

Generate timeline with:
1. Key filing milestones
2. Document preparation phases
3. Review & correction periods
4. Submission deadlines
5. Post-filing actions
6. Estimated timeline in weeks`,
      response_json_schema: {
        type: 'object',
        properties: {
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                phase: { type: 'string' },
                start_week: { type: 'number' },
                end_week: { type: 'number' },
                tasks: { type: 'array', items: { type: 'string' } },
                critical: { type: 'boolean' }
              }
            }
          },
          total_weeks: { type: 'number' },
          current_phase: { type: 'string' },
          progress_percentage: { type: 'number' },
          milestones: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      timeline: {
        country,
        tax_year: taxYear,
        filing_data: filing,
        compliance_items: compliance.length,
        documents_collected: documents.length,
        phases: timeline
      }
    });
  } catch (error) {
    console.error('Create filing timeline error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});