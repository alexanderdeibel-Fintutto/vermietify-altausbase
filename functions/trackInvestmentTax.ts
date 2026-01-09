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

    // Fetch investment data
    const [investments, capitalGains, capitalLosses] = await Promise.all([
      base44.entities.Investment.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.CapitalGain.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxLossCarryforward.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const totalCapitalGains = capitalGains.reduce((sum, g) => sum + (g.capital_gain || 0), 0);
    const totalCapitalLosses = capitalLosses.reduce((sum, l) => sum + (l.remaining_amount || 0), 0);

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze investment tax situation for ${country}, year ${taxYear}.

Portfolio:
- Total investments: ${investments.length}
- Realized capital gains: €${Math.round(totalCapitalGains)}
- Available losses: €${Math.round(totalCapitalLosses)}

Provide analysis:
1. Overall investment tax liability
2. Dividend income tracking
3. Capital gains optimization
4. Loss harvesting opportunities
5. Asset location strategy
6. Wash sale risks
7. Tax-loss carryforward status
8. Recommendations`,
      response_json_schema: {
        type: 'object',
        properties: {
          total_investment_income: { type: 'number' },
          taxable_gains: { type: 'number' },
          available_losses: { type: 'number' },
          net_position: { type: 'number' },
          dividend_income: { type: 'number' },
          interest_income: { type: 'number' },
          tax_liability: { type: 'number' },
          optimization_opportunities: { type: 'array', items: { type: 'string' } },
          wash_sale_warnings: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      analysis
    });
  } catch (error) {
    console.error('Investment tax tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});