import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portfolioId, riskTolerance } = await req.json();

    console.log(`Optimizing portfolio ${portfolioId} with risk ${riskTolerance}`);

    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      id: portfolioId
    });

    if (!assets || assets.length === 0) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const asset = assets[0];
    const portfolioValue = asset.quantity * asset.current_value;

    // Simple optimization: adjust allocation based on risk tolerance
    const baseReturn = 0.05;
    const baseVolatility = 0.08;
    const riskMultiplier = riskTolerance / 5;

    const currentReturn = baseReturn;
    const optimizedReturn = baseReturn + (riskMultiplier * 0.03);
    const currentVolatility = baseVolatility;
    const optimizedVolatility = baseVolatility * riskMultiplier;

    // Generate projected growth
    const projectedGrowth = [];
    for (let i = 0; i <= 12; i++) {
      projectedGrowth.push({
        month: `M${i}`,
        current: portfolioValue * Math.pow(1 + currentReturn / 12, i),
        optimized: portfolioValue * Math.pow(1 + optimizedReturn / 12, i)
      });
    }

    const recommendations = [
      riskTolerance > 6 ? 'Mehr in Wachstumswerte investieren' : 'Konservativere Allocation wählen',
      'Diversifikation erhöhen',
      'Regelmäßiges Rebalancing durchführen',
      'Steuerliche Effizienz prüfen'
    ];

    return Response.json({
      success: true,
      current_return: currentReturn * 100,
      optimized_return: optimizedReturn * 100,
      current_volatility: currentVolatility * 100,
      optimized_volatility: optimizedVolatility * 100,
      projected_growth: projectedGrowth,
      recommendations
    });
  } catch (error) {
    console.error('Portfolio optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});