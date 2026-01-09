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

    // Fetch tax data
    const [filings, docs, compliance] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 5).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 5).catch(() => [])
    ]);

    const checklist = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate tax year closing checklist for ${country}, year ${taxYear}.

Current data:
- Filings: ${filings.length}
- Documents: ${docs.length}
- Compliance items: ${compliance.length}

Create checklist with:
1. Critical final tasks
2. Documentation gathering
3. Filing preparations
4. Record retention
5. Archiving steps
6. Year-end review items`,
      response_json_schema: {
        type: 'object',
        properties: {
          critical_tasks: { type: 'array', items: { type: 'object', properties: { task: { type: 'string' }, deadline: { type: 'string' }, priority: { type: 'string' } }, additionalProperties: true } },
          documentation: { type: 'array', items: { type: 'string' } },
          filings: { type: 'array', items: { type: 'string' } },
          review_items: { type: 'array', items: { type: 'string' } },
          retention_guidelines: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      checklist: {
        country,
        tax_year: taxYear,
        items: checklist
      }
    });
  } catch (error) {
    console.error('Generate checklist error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});