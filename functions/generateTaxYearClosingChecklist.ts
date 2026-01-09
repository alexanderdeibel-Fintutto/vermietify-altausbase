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

    // Fetch all tax data to determine status
    const [filings, documents, compliance, deadlines] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxDeadline.filter({ country, is_active: true }) || []
    ]);

    const checklist = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a comprehensive tax year closing checklist for ${country} for tax year ${taxYear}.

Status:
- Filings: ${filings.length} (${filings.filter(f => f.status === 'submitted').length} submitted)
- Documents: ${documents.length} (${documents.filter(d => d.status === 'processed').length} processed)
- Compliance: ${compliance.length} (${compliance.filter(c => c.status === 'completed').length} completed)
- Deadlines: ${deadlines.length}

Generate a detailed checklist with:
1. Critical closing tasks
2. Document collection requirements
3. Filing deadlines
4. Final reviews needed
5. Archive and storage steps
6. Tax advisor coordination tasks
7. Estimated timeline
8. Risk mitigation items`,
      response_json_schema: {
        type: 'object',
        properties: {
          critical_tasks: { type: 'array', items: { type: 'object', additionalProperties: true } },
          documentation: { type: 'array', items: { type: 'string' } },
          filings: { type: 'array', items: { type: 'object', additionalProperties: true } },
          reviews: { type: 'array', items: { type: 'string' } },
          archival: { type: 'array', items: { type: 'string' } },
          timeline: { type: 'string' },
          completion_estimate: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      checklist: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        checklist: checklist
      }
    });
  } catch (error) {
    console.error('Generate checklist error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});