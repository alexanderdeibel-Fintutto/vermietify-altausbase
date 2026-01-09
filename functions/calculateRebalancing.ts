import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portfolioId, strategyId } = await req.json();

    console.log(`Calculating rebalancing for ${portfolioId}`);

    // Get strategy
    const strategies = await base44.asServiceRole.entities.RebalancingStrategy.filter({
      id: strategyId
    });
    const strategy = strategies?.[0];

    if (!strategy) {
      return Response.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Get current portfolio
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      id: portfolioId
    });

    const asset = assets?.[0];
    if (!asset) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Calculate current allocation
    const totalValue = asset.quantity * asset.current_value;
    const currentAllocation = {
      [asset.asset_category]: 100
    };

    // Calculate deviations
    const actions = [];
    for (const [category, targetPercent] of Object.entries(strategy.target_allocation)) {
      const currentPercent = currentAllocation[category] || 0;
      const deviation = currentPercent - targetPercent;

      if (Math.abs(deviation) > strategy.deviation_threshold) {
        const amount = (totalValue * deviation) / 100;
        actions.push({
          asset_name: asset.name,
          category,
          action: amount > 0 ? 'SELL' : 'BUY',
          amount: Math.abs(amount),
          deviation
        });
      }
    }

    const allocationComparison = Object.entries(strategy.target_allocation).map(([category, target]) => ({
      category,
      current: currentAllocation[category] || 0,
      target
    }));

    console.log(`Rebalancing plan created: ${actions.length} actions`);

    return Response.json({
      success: true,
      actions,
      allocation_comparison: allocationComparison
    });
  } catch (error) {
    console.error('Rebalancing calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});