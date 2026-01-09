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

    // Fetch risk-related data
    const [filings, compliance, audits, alerts, scenarios] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxAuditFile.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const riskAssessment = await base44.integrations.Core.InvokeLLM({
      prompt: `Assess tax risk for ${country}, year ${taxYear}.

Profile:
- Filing Status: ${filings.length > 0 ? filings[0].status : 'Not filed'}
- Compliance Issues: ${compliance.filter(c => c.status === 'at_risk').length}
- Audit History: ${audits.length}
- Active Alerts: ${alerts.filter(a => !a.is_resolved).length}
- Scenarios Analyzed: ${scenarios.length}

Analyze:
1. Overall risk score (0-100)
2. Risk categories and severity
3. Red flags and concerns
4. Audit probability
5. Mitigation strategies
6. Recommended actions`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_risk_score: { type: 'number' },
          risk_level: { type: 'string' },
          risk_categories: { type: 'array', items: { type: 'object', additionalProperties: true } },
          audit_probability: { type: 'number' },
          red_flags: { type: 'array', items: { type: 'string' } },
          compliance_gaps: { type: 'array', items: { type: 'string' } },
          mitigation_strategies: { type: 'array', items: { type: 'string' } },
          priority_actions: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      assessment: {
        country,
        tax_year: taxYear,
        analysis: riskAssessment
      }
    });
  } catch (error) {
    console.error('Calculate risk error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});