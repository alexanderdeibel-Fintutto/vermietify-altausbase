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

    // Fetch all tax-related data
    const [filings, calculations, planning, scenarios, alerts, documents] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: `Create comprehensive tax summary for ${country}, year ${taxYear}.

Data:
- Filings: ${filings.length}
- Calculations: ${calculations.length} (Total tax: €${calculations.reduce((s, c) => s + (c.total_tax || 0), 0)})
- Planning Items: ${planning.length}
- Scenarios Analyzed: ${scenarios.length}
- Active Alerts: ${alerts.filter(a => !a.is_resolved).length}
- Documents: ${documents.length}

Provide:
1. Executive summary
2. Tax liability overview
3. Key planning items
4. Risk assessment
5. Action items
6. Next steps timeline`,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          total_tax_liability: { type: 'number' },
          filing_status: { type: 'string' },
          key_metrics: { type: 'object', additionalProperties: { type: 'number' } },
          planning_items: { type: 'array', items: { type: 'string' } },
          risk_assessment: { type: 'string' },
          action_items: { type: 'array', items: { type: 'string' } },
          compliance_status: { type: 'string' },
          estimated_refund_or_liability: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      summary: {
        country,
        tax_year: taxYear,
        filing_count: filings.length,
        document_count: documents.length,
        analysis: summary
      }
    });
  } catch (error) {
    console.error('Consolidate summary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});