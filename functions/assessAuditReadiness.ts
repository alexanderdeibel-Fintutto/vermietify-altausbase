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

    // Fetch audit-relevant data
    const [filings, documents, compliance, calculations, alerts] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxAlert.filter({ user_email: user.email, country }) || []
    ]);

    const assessment = await base44.integrations.Core.InvokeLLM({
      prompt: `Assess audit readiness for ${country} taxpayer for tax year ${taxYear}.

Data Summary:
- Filings: ${filings.length} (${filings.filter(f => f.status === 'submitted').length} submitted)
- Documents: ${documents.length} (${documents.filter(d => d.status === 'processed').length} processed)
- Compliance Items: ${compliance.length} (${compliance.filter(c => c.status === 'completed').length} completed)
- Tax Calculations: ${calculations.length}
- Active Alerts: ${alerts.length}

Provide comprehensive audit readiness assessment:
1. Overall readiness score (0-100)
2. Critical vulnerabilities
3. Documentation gaps
4. High-risk areas
5. Compliance gaps
6. Record-keeping assessment
7. Timeline adequacy
8. Recommended actions before audit
9. Support documentation needed
10. Estimated audit risk level`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_readiness: { type: 'number' },
          audit_risk_level: { type: 'string' },
          vulnerabilities: { type: 'array', items: { type: 'object', additionalProperties: true } },
          documentation_gaps: { type: 'array', items: { type: 'string' } },
          compliance_issues: { type: 'array', items: { type: 'string' } },
          high_risk_areas: { type: 'array', items: { type: 'string' } },
          record_keeping_score: { type: 'number' },
          recommended_actions: { type: 'array', items: { type: 'string' } },
          timeline_adequacy: { type: 'string' },
          estimated_vulnerability_percentage: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      assessment: {
        country,
        tax_year: taxYear,
        assessed_at: new Date().toISOString(),
        data_summary: {
          filings: filings.length,
          documents: documents.length,
          compliance_items: compliance.length
        },
        assessment: assessment
      }
    });
  } catch (error) {
    console.error('Assess audit readiness error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});