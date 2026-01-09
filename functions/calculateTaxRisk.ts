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

    // Fetch comprehensive tax data
    const [docs, filings, compliance, audits, alerts] = await Promise.all([
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxAuditFile.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxAlert.filter({ user_email: user.email, country, tax_year: taxYear }) || []
    ]);

    const riskAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Assess tax risk level for taxpayer in ${country} for tax year ${taxYear}.

Data Summary:
- Documents: ${docs.length} (${docs.filter(d => d.status === 'processed').length} processed)
- Filings: ${filings.length} (${filings.filter(f => f.status === 'submitted').length} submitted)
- Compliance Items: ${compliance.length} (${compliance.filter(c => c.status === 'completed').length} completed)
- Audit Files: ${audits.length}
- Alerts: ${alerts.length} (${alerts.filter(a => a.severity === 'critical').length} critical)

Calculate and provide:
1. Overall risk score (0-100)
2. Risk level (low/medium/high/critical)
3. Key risk factors
4. Compliance gaps
5. Audit vulnerability score
6. Mitigation recommendations
7. Priority actions
8. Timeline for risk reduction`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_risk_score: { type: 'number' },
          risk_level: { type: 'string' },
          key_risk_factors: { type: 'array', items: { type: 'string' } },
          compliance_gaps: { type: 'array', items: { type: 'string' } },
          audit_vulnerability_score: { type: 'number' },
          mitigation_recommendations: { type: 'array', items: { type: 'string' } },
          priority_actions: { type: 'array', items: { type: 'string' } },
          timeline: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      risk_assessment: {
        country,
        tax_year: taxYear,
        assessed_at: new Date().toISOString(),
        data_summary: {
          documents: docs.length,
          filings: filings.length,
          compliance_items: compliance.length,
          audits: audits.length,
          alerts: alerts.length
        },
        analysis: riskAnalysis
      }
    });
  } catch (error) {
    console.error('Calculate tax risk error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});