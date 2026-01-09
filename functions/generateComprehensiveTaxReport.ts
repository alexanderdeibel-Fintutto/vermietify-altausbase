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

    // Fetch all tax data with limits to prevent rate limiting
    const [calcs, filings, docs, compliance, alerts, scenarios] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 3).catch(() => []),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 5).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 5).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxScenario.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 3).catch(() => [])
    ]);

    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive tax report for ${country} taxpayer, tax year ${taxYear}.

Data Summary:
- Tax Calculations: ${calcs.length}
- Tax Filings: ${filings.length} (${filings.filter(f => f.status === 'submitted').length} submitted)
- Documents: ${docs.length} (${docs.filter(d => d.status === 'processed').length} processed)
- Compliance Items: ${compliance.length} (${compliance.filter(c => c.status === 'completed').length} completed)
- Alerts: ${alerts.length}
- Scenarios Analyzed: ${scenarios.length}

Total Tax: €${calcs.reduce((s, c) => s + (c.total_tax || 0), 0)}

Generate comprehensive report with:
1. Executive summary
2. Key metrics and KPIs
3. Tax liability breakdown
4. Filing status overview
5. Compliance assessment
6. Document checklist
7. Risk analysis
8. Recommendations
9. Timeline for next steps
10. Year-over-year comparison suggestion`,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          key_metrics: { type: 'object', additionalProperties: true },
          tax_breakdown: { type: 'object', additionalProperties: true },
          filing_status: { type: 'string' },
          compliance_score: { type: 'number' },
          critical_items: { type: 'array', items: { type: 'string' } },
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
        content: report
      }
    });
  } catch (error) {
    console.error('Generate comprehensive report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});