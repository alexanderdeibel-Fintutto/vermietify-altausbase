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

    // Fetch comprehensive data
    const [filings, calculations, documents, compliance, alerts] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const profile = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive tax risk profile for ${country}, year ${taxYear}.

Tax Data:
- Filings: ${filings.length}
- Calculations: ${calculations.length}
- Documents: ${documents.length}
- Compliance Items: ${compliance.length}
- Alerts: ${alerts.length}

Analyze:
1. Overall audit risk score (1-10)
2. Red flag identification
3. Documentation completeness score
4. Compliance adherence rating
5. High-risk deduction/income areas
6. Regulatory trend analysis
7. Mitigation recommendations
8. Monitoring recommendations
9. Preparation level assessment`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_risk_score: { type: 'number' },
          risk_level: { type: 'string' },
          red_flags: { type: 'array', items: { type: 'object', additionalProperties: true } },
          documentation_score: { type: 'number' },
          compliance_rating: { type: 'string' },
          high_risk_areas: { type: 'array', items: { type: 'string' } },
          mitigation_strategies: { type: 'array', items: { type: 'string' } },
          monitoring_recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      profile: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: profile
      }
    });
  } catch (error) {
    console.error('Generate tax risk profile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});