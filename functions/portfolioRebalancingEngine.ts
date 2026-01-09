import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id, target_allocation } = await req.json();

    const user = await base44.auth.me();
    if (!user || user.id !== user_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all assets
    const assets = await base44.entities.AssetPortfolio.filter({
      user_id: user_id,
      status: 'active'
    });

    // Calculate current allocation
    const totalValue = assets.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
    const currentAllocation = {};

    for (const asset of assets) {
      const cat = asset.asset_category;
      const value = asset.quantity * asset.current_value;
      const percent = (value / totalValue) * 100;

      if (!currentAllocation[cat]) {
        currentAllocation[cat] = { value: 0, percent: 0, assets: [] };
      }
      currentAllocation[cat].value += value;
      currentAllocation[cat].percent = (currentAllocation[cat].value / totalValue) * 100;
      currentAllocation[cat].assets.push(asset);
    }

    // Calculate rebalancing suggestions
    const suggestions = [];
    const trades = [];

    for (const [category, targetPercent] of Object.entries(target_allocation || {})) {
      const current = currentAllocation[category];
      const currentPercent = current ? current.percent : 0;
      const deviation = currentPercent - targetPercent;

      if (Math.abs(deviation) > 2) { // Only suggest if >2% deviation
        const targetValue = (targetPercent / 100) * totalValue;
        const currentValue = current ? current.value : 0;
        const tradeValue = targetValue - currentValue;

        suggestions.push({
          category,
          current_allocation: currentPercent.toFixed(1),
          target_allocation: targetPercent.toFixed(1),
          deviation: deviation.toFixed(1),
          action: tradeValue > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(tradeValue)
        });

        if (tradeValue > 0 && current) {
          trades.push({
            type: 'BUY',
            category,
            amount: tradeValue,
            suggested_assets: current.assets.map(a => ({
              id: a.id,
              name: a.name,
              weight_in_category: (a.quantity * a.current_value) / current.value
            }))
          });
        } else if (tradeValue < 0 && current) {
          trades.push({
            type: 'SELL',
            category,
            amount: Math.abs(tradeValue),
            sellable_assets: current.assets
              .map(a => ({
                id: a.id,
                name: a.name,
                current_value: a.quantity * a.current_value
              }))
              .sort((a, b) => b.current_value - a.current_value)
          });
        }
      }
    }

    // Create alert for rebalancing
    if (suggestions.length > 0) {
      await base44.asServiceRole.entities.PortfolioAlert.create({
        user_id: user_id,
        alert_type: 'rebalancing',
        severity: 'info',
        title: 'Portfolio-Rebalancing empfohlen',
        message: `Ihr Portfolio weicht um durchschnittlich ${(suggestions.reduce((sum, s) => sum + Math.abs(parseFloat(s.deviation)), 0) / suggestions.length).toFixed(1)}% von der Zielallokation ab.`,
        action_suggestions: suggestions,
        triggered_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return Response.json({
      success: true,
      current_allocation: currentAllocation,
      target_allocation,
      suggestions,
      trades,
      total_value: totalValue
    });
  } catch (error) {
    console.error('portfolioRebalancingEngine error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});