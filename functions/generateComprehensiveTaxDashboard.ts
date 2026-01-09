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

    const [filings, calculations, deadlines, alerts] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxDeadline.filter({ country }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const dashboard = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive tax dashboard summary for ${country}, year ${taxYear}.

Data Available:
- Tax Filings: ${filings.length}
- Calculations: ${calculations.length}
- Deadlines: ${deadlines.length}
- Active Alerts: ${alerts.length}

Provide:
1. Overall tax status (%)
2. Key performance indicators
3. Critical next actions
4. Upcoming deadlines (sorted by urgency)
5. Status of each tax filing
6. Risk assessment summary
7. Recommended optimizations
8. Year-end checklist progress`,
      response_json_schema: {
        type: 'object',
        properties: {
          completion_percentage: { type: 'number' },
          kpis: { type: 'array', items: { type: 'object', additionalProperties: true } },
          critical_actions: { type: 'array', items: { type: 'string' } },
          upcoming_deadlines: { type: 'array', items: { type: 'string' } },
          filing_status: { type: 'object', additionalProperties: true },
          risk_level: { type: 'string' },
          optimizations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      dashboard: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        data_snapshot: { filings: filings.length, calculations: calculations.length, alerts: alerts.length },
        content: dashboard
      }
    });
  } catch (error) {
    console.error('Generate comprehensive dashboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});