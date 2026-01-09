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

    // Fetch capital gains and investment data
    const [gains, losses, investments] = await Promise.all([
      base44.entities.CapitalGain.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.Investment.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const totalGains = gains.reduce((sum, g) => sum + (g.capital_gain || 0), 0);
    const totalLosses = losses.reduce((sum, l) => sum + (l.remaining_amount || 0), 0);

    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimize capital gains strategy for ${country}, year ${taxYear}.

Portfolio Data:
- Realized gains: €${Math.round(totalGains)}
- Available losses: €${Math.round(totalLosses)}
- Investments: ${investments.length}

Provide optimization strategies:
1. Current tax position
2. Loss harvesting timing
3. Gain realization strategy
4. Asset location optimization
5. Holding period optimization
6. Estimated tax savings
7. Implementation roadmap
8. Risk considerations`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_position: { type: 'object', additionalProperties: true },
          optimization_strategies: { type: 'array', items: { type: 'object', additionalProperties: true } },
          estimated_savings: { type: 'number' },
          implementation_timeline: { type: 'array', items: { type: 'string' } },
          tax_consequences: { type: 'array', items: { type: 'string' } },
          compliance_notes: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      optimization
    });
  } catch (error) {
    console.error('Capital gains optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});