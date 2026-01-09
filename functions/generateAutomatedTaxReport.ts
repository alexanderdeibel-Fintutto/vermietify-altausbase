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

    // Fetch all relevant data
    const [filings, calculations, documents, compliance, alerts] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const filingStatus = filings.length > 0 ? filings[0].status : 'not_started';
    const complianceRate = compliance.length > 0 
      ? (compliance.filter(c => c.status === 'completed').length / compliance.length * 100)
      : 0;

    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive tax report for ${country}, year ${taxYear}.

Summary Data:
- Total Tax: €${totalTax}
- Filing Status: ${filingStatus}
- Documents: ${documents.length}
- Compliance Items: ${compliance.length} (${Math.round(complianceRate)}% complete)
- Active Alerts: ${alerts.filter(a => !a.is_resolved).length}

Create professional report with:
1. Executive summary
2. Financial overview
3. Tax liability analysis
4. Compliance status
5. Documentation checklist
6. Action items
7. Next steps`,
      response_json_schema: {
        type: 'object',
        properties: {
          report_title: { type: 'string' },
          executive_summary: { type: 'string' },
          financial_overview: { type: 'object', additionalProperties: true },
          tax_analysis: { type: 'object', additionalProperties: true },
          compliance_status: { type: 'string' },
          documentation_status: { type: 'array', items: { type: 'string' } },
          action_items: { type: 'array', items: { type: 'string' } },
          timeline: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      report: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        data_summary: {
          total_tax: totalTax,
          filing_status: filingStatus,
          documents_count: documents.length,
          compliance_rate: Math.round(complianceRate)
        },
        report_content: report
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});