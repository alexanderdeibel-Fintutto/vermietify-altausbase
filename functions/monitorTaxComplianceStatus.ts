import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    // Fetch compliance data
    const [compliance, alerts, deadlines, filings] = await Promise.all([
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }, '-updated_date', 5).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxDeadline.filter({ country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const status = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze tax compliance status for ${country} taxpayer, tax year ${taxYear}.

Data:
- Compliance items: ${compliance.length} (${compliance.filter(c => c.status === 'completed').length} completed)
- Active alerts: ${alerts.length}
- Deadlines: ${deadlines.length}
- Filings: ${filings.length}

Provide:
1. Compliance score (0-100)
2. Critical issues
3. At-risk areas
4. Recommended next steps
5. Deadline summary
6. Risk assessment`,
      response_json_schema: {
        type: 'object',
        properties: {
          compliance_score: { type: 'number' },
          status: { type: 'string' },
          critical_issues: { type: 'array', items: { type: 'string' } },
          at_risk_items: { type: 'array', items: { type: 'string' } },
          next_steps: { type: 'array', items: { type: 'string' } },
          overall_assessment: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      compliance_status: {
        country,
        tax_year: taxYear,
        assessment: status
      }
    });
  } catch (error) {
    console.error('Monitor compliance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});