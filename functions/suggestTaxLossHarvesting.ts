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
    const [gains, losses] = await Promise.all([
      base44.entities.CapitalGain.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country, status: 'pending' }).catch(() => [])
    ]);

    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze tax loss harvesting opportunities for ${country} taxpayer, tax year ${taxYear}.

Current Situation:
- Capital Gains: €${gains.reduce((sum, g) => sum + (g.capital_gain || 0), 0)}
- Available Loss Carryforwards: €${losses.reduce((sum, l) => sum + (l.remaining_amount || 0), 0)}
- Gains Count: ${gains.length}
- Loss Items: ${losses.length}

Provide:
1. Recommended asset realizations (with estimated losses)
2. Timing optimization
3. Tax savings potential
4. Wash sale warnings
5. Implementation strategy`,
      response_json_schema: {
        type: 'object',
        properties: {
          total_potential_savings: { type: 'number' },
          harvest_recommendations: { type: 'array', items: { type: 'object', additionalProperties: true } },
          carryforward_strategy: { type: 'string' },
          wash_sale_risks: { type: 'array', items: { type: 'string' } },
          implementation_steps: { type: 'array', items: { type: 'string' } },
          timeline: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      analysis: {
        country,
        tax_year: taxYear,
        current_gains: gains.reduce((sum, g) => sum + (g.capital_gain || 0), 0),
        available_losses: losses.reduce((sum, l) => sum + (l.remaining_amount || 0), 0),
        suggestions
      }
    });
  } catch (error) {
    console.error('Tax loss harvesting error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});