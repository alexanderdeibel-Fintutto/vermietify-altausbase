import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, format } = await req.json();

    if (!country || !taxYear || !format) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch tax data
    const [calculations, documents, filings, compliance] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const exportData = await base44.integrations.Core.InvokeLLM({
      prompt: `Prepare tax data export for ${country}, year ${taxYear} in ${format} format.

Data Available:
- Calculations: ${calculations.length}
- Documents: ${documents.length}
- Filings: ${filings.length}
- Compliance Items: ${compliance.length}

Generate:
1. Export structure and hierarchy
2. Data validation checks
3. Format-specific requirements
4. Export file naming convention
5. Checksum or verification data
6. README with import instructions`,
      response_json_schema: {
        type: 'object',
        properties: {
          export_summary: { type: 'object', additionalProperties: true },
          file_structure: { type: 'array', items: { type: 'string' } },
          validation_rules: { type: 'array', items: { type: 'string' } },
          format_requirements: { type: 'object', additionalProperties: true },
          import_instructions: { type: 'array', items: { type: 'string' } },
          recommended_archiving: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      export: {
        country,
        tax_year: taxYear,
        format,
        generated_at: new Date().toISOString(),
        content: exportData,
        record_count: {
          calculations: calculations.length,
          documents: documents.length,
          filings: filings.length,
          compliance_items: compliance.length
        }
      }
    });
  } catch (error) {
    console.error('Export tax data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});