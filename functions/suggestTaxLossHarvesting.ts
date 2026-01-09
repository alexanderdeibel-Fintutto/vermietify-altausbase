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

    // Fetch capital gains and losses
    const [capitalGains, losses] = await Promise.all([
      base44.entities.CapitalGain.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const totalGains = capitalGains.reduce((sum, g) => sum + (g.capital_gain || 0), 0);
    const totalLosses = capitalGains.reduce((sum, g) => sum + Math.min(g.capital_gain || 0, 0), 0);
    const unusedLosses = losses.reduce((sum, l) => sum + (l.remaining_amount || 0), 0);

    const suggestion = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze tax loss harvesting opportunities for ${country}, year ${taxYear}.

Portfolio Summary:
- Realized Gains: €${Math.round(totalGains)}
- Realized Losses: €${Math.round(totalLosses)}
- Unused Loss Carryforward: €${Math.round(unusedLosses)}

Provide:
1. Current tax loss position
2. Tax loss harvesting opportunities (upcoming assets to consider)
3. Wash sale risk analysis
4. Optimal realization timing
5. Expected tax savings
6. Implementation steps
7. Risk/compliance considerations`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_position: { type: 'object', additionalProperties: true },
          harvesting_opportunities: { type: 'array', items: { type: 'object', additionalProperties: true } },
          wash_sale_warnings: { type: 'array', items: { type: 'string' } },
          optimal_timing: { type: 'string' },
          expected_tax_savings: { type: 'number' },
          implementation_steps: { type: 'array', items: { type: 'string' } },
          compliance_notes: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      analysis: suggestion
    });
  } catch (error) {
    console.error('Tax loss harvesting error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});