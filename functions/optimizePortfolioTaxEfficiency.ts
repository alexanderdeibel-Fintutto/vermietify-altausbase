import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();

    // Hole Portfolio Assets
    const assets = await base44.entities.AssetPortfolio.filter({
      user_email: user.email
    });

    // Portfolio Tax Optimization
    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimiere Portfolio-Steuern für ${user.email} in ${country} (${tax_year}):

PORTFOLIO ASSETS:
${JSON.stringify(assets.map(a => ({
  asset: a.description,
  quantity: a.quantity,
  cost_basis: a.cost_basis,
  current_value: a.current_value,
  unrealized_gain: a.current_value - a.cost_basis,
  holding_period: Math.floor((Date.now() - new Date(a.acquisition_date)) / (365 * 24 * 60 * 60 * 1000))
})), null, 2)}

TAX OPTIMIZATION STRATEGIEN:
1. Tax Loss Harvesting (Sell losers)
2. Gain Realization (Control timing)
3. Asset Location (Tax-efficient account types)
4. Dividend Timing
5. Long-term vs. Short-term Gains
6. Wash Sale Avoidance
7. Currency Gains/Losses
8. Charitable Donations (appreciated securities)

BERECHNE:
- Current unrealized gains/losses
- Optimal actions this year
- Estimated tax impact
- Refund/payment changes`,
      response_json_schema: {
        type: "object",
        properties: {
          total_portfolio_value: { type: "number" },
          total_unrealized_gains: { type: "number" },
          tax_loss_harvesting_opportunity: { type: "number" },
          recommended_actions: { type: "array", items: { type: "string" } },
          estimated_tax_savings: { type: "number" },
          implementation_priority: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      portfolio_optimization: optimization
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});