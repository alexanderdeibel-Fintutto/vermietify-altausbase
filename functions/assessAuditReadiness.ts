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
    const [filings, documents, compliance, calculations, alerts] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const assessment = await base44.integrations.Core.InvokeLLM({
      prompt: `Assess audit readiness for ${country}, year ${taxYear}.

Data:
- Filings: ${filings.length}
- Documents: ${documents.length}
- Compliance items: ${compliance.length} (${compliance.filter(c => c.status === 'completed').length} completed)
- Calculations filed: ${calculations.length}
- Open alerts: ${alerts.filter(a => !a.is_resolved).length}

Provide comprehensive audit readiness assessment:
1. Overall readiness score (0-100)
2. Documentation completeness
3. Record retention compliance
4. Red flags and risk areas
5. Critical gaps
6. Preparation recommendations
7. Timeline for improvement`,
      response_json_schema: {
        type: 'object',
        properties: {
          readiness_score: { type: 'number' },
          status: { type: 'string' },
          documentation_score: { type: 'number' },
          compliance_score: { type: 'number' },
          record_retention_score: { type: 'number' },
          red_flags: { type: 'array', items: { type: 'string' } },
          critical_gaps: { type: 'array', items: { type: 'string' } },
          audit_risk_level: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } },
          weeks_to_prepare: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      assessment
    });
  } catch (error) {
    console.error('Audit readiness error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});