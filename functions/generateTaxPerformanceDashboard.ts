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
    const [filings, calculations, compliance, documents, alerts, scenarios] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const complianceRate = compliance.length > 0 
      ? (compliance.filter(c => c.status === 'completed').length / compliance.length * 100)
      : 0;

    const dashboard = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive tax performance dashboard for ${country}, year ${taxYear}.

Metrics:
- Total Tax: €${Math.round(totalTax)}
- Documents: ${documents.length}
- Compliance: ${Math.round(complianceRate)}%
- Filing Status: ${filings.length > 0 ? filings[0].status : 'not started'}
- Open Alerts: ${alerts.filter(a => !a.is_resolved).length}
- Scenarios: ${scenarios.length}

Provide:
1. Key performance indicators (KPIs)
2. Progress metrics
3. Risk indicators
4. Compliance status
5. Document completeness
6. Next critical actions
7. Performance trend analysis`,
      response_json_schema: {
        type: 'object',
        properties: {
          kpis: { type: 'object', additionalProperties: true },
          progress_metrics: { type: 'object', additionalProperties: true },
          risk_indicators: { type: 'array', items: { type: 'object', additionalProperties: true } },
          completion_status: { type: 'object', additionalProperties: true },
          next_actions: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      dashboard: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        metrics: {
          total_tax: totalTax,
          documents_count: documents.length,
          compliance_rate: Math.round(complianceRate)
        },
        content: dashboard
      }
    });
  } catch (error) {
    console.error('Dashboard generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});