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
    const [filings, calculations, documents, compliance, alerts, scenarios, losses] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const documentCount = documents.length;
    const complianceRate = compliance.length > 0 
      ? (compliance.filter(c => c.status === 'completed').length / compliance.length * 100)
      : 0;

    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive professional tax report for ${country}, year ${taxYear}.

Summary Data:
- Total Tax: €${Math.round(totalTax)}
- Documents: ${documentCount}
- Compliance Rate: ${Math.round(complianceRate)}%
- Scenarios Analyzed: ${scenarios.length}
- Loss Carryforwards: ${losses.length}
- Active Alerts: ${alerts.filter(a => !a.is_resolved).length}

Create executive-ready report with:
1. Professional summary
2. Key metrics and KPIs
3. Tax calculation overview
4. Compliance status
5. Risk assessment
6. Planning recommendations
7. Next steps and timeline`,
      response_json_schema: {
        type: 'object',
        properties: {
          report_title: { type: 'string' },
          executive_summary: { type: 'string' },
          key_metrics: { type: 'object', additionalProperties: true },
          calculation_overview: { type: 'object', additionalProperties: true },
          compliance_status: { type: 'string' },
          risk_assessment: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } },
          next_steps: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      report: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: report,
        data_summary: {
          total_tax: totalTax,
          documents_count: documentCount,
          compliance_rate: Math.round(complianceRate)
        }
      }
    });
  } catch (error) {
    console.error('Generate comprehensive report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});