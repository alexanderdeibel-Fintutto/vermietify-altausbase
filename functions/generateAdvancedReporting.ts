import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, reportType } = await req.json();

    if (!country || !taxYear || !reportType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch all relevant data
    const [calculations, filings, documents, compliance, planning, alerts] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxAlert.filter({ user_email: user.email, country, tax_year: taxYear }) || []
    ]);

    const reportPrompt = `Generate a comprehensive ${reportType} tax report for ${country} tax year ${taxYear}.

Data:
- Total Calculated Tax: €${calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0)}
- Filings: ${filings.length} (${filings.filter(f => f.status === 'submitted').length} submitted)
- Documents: ${documents.length} (${documents.filter(d => d.status === 'processed').length} processed)
- Compliance: ${compliance.length} (${compliance.filter(c => c.status === 'completed').length} completed)
- Strategies: ${planning.length}
- Alerts: ${alerts.length}

Report Type: ${reportType}
Provide detailed analysis, insights, recommendations, and next steps.`;

    const report = await base44.integrations.Core.InvokeLLM({
      prompt: reportPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          key_findings: { type: 'array', items: { type: 'string' } },
          metrics: { type: 'object', additionalProperties: true },
          analysis: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } },
          next_steps: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      report: {
        country,
        tax_year: taxYear,
        report_type: reportType,
        generated_at: new Date().toISOString(),
        report: report
      }
    });
  } catch (error) {
    console.error('Generate advanced report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});