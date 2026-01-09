import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, income, filingStatus } = await req.json();

    if (!country || !taxYear || !income) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const calculation = await base44.integrations.Core.InvokeLLM({
      prompt: `Calculate marginal tax rate and tax brackets for ${country}, year ${taxYear}.

Income Profile:
- Annual Income: €${Math.round(income)}
- Filing Status: ${filingStatus || 'Individual'}

Provide:
1. Applicable tax brackets
2. Current marginal tax rate
3. Effective tax rate calculation
4. Income thresholds for each bracket
5. Impact of €1 additional income
6. Phase-out zones (credits, deductions)
7. Surtaxes and surcharges
8. Social security/medicare implications
9. State/local tax impact (if applicable)
10. Tax bracket planning opportunities`,
      response_json_schema: {
        type: 'object',
        properties: {
          income_summary: { type: 'object', additionalProperties: true },
          tax_brackets: { type: 'array', items: { type: 'object', additionalProperties: true } },
          marginal_rate: { type: 'number' },
          effective_rate: { type: 'number' },
          total_tax_liability: { type: 'number' },
          additional_dollar_impact: { type: 'object', additionalProperties: true },
          planning_opportunities: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      calculation: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        content: calculation
      }
    });
  } catch (error) {
    console.error('Calculate marginal tax rate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});