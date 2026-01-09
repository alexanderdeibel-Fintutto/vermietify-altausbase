import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portfolioId, userId } = await req.json();

    console.log(`Generating AI recommendations for portfolio ${portfolioId}`);

    // Get portfolio data
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      id: portfolioId
    });

    if (!assets || assets.length === 0) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Calculate portfolio metrics
    const totalValue = assets.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
    const allocation = {};
    assets.forEach(a => {
      allocation[a.asset_category] = (allocation[a.asset_category] || 0) + (a.quantity * a.current_value);
    });

    const recommendations = [];

    // Check diversification
    const categoryCount = Object.keys(allocation).length;
    if (categoryCount < 3) {
      recommendations.push({
        type: 'diversification',
        title: 'Diversifikation verbessern',
        confidence: 85,
        impact: 60,
        description: 'Ihr Portfolio konzentriert sich auf ' + categoryCount + ' Kategorien. Empfohlen: 5-7 Kategorien'
      });
    }

    // Check concentration risk
    for (const [category, value] of Object.entries(allocation)) {
      const percent = (value / totalValue) * 100;
      if (percent > 50) {
        recommendations.push({
          type: 'concentration_risk',
          title: 'Konzentrationsrisiko erkannt',
          confidence: 90,
          impact: 75,
          description: `${category} macht ${percent.toFixed(1)}% aus. Empfohlen: Reduktion auf max 30%`
        });
      }
    }

    // Check for tax loss harvesting opportunities
    const realizedLosses = assets.filter(a => a.unrealized_gains < 0);
    if (realizedLosses.length > 0 && realizedLosses.reduce((sum, a) => sum + Math.abs(a.unrealized_gains || 0), 0) > 1000) {
      recommendations.push({
        type: 'tax_loss_harvesting',
        title: 'Steueroptimierung möglich',
        confidence: 80,
        impact: 45,
        description: 'Verluste können mit Gewinnen verrechnet werden'
      });
    }

    // Check for rebalancing
    const maxAllocation = Math.max(...Object.values(allocation));
    const avgAllocation = totalValue / categoryCount;
    if (maxAllocation > avgAllocation * 1.5) {
      recommendations.push({
        type: 'rebalancing',
        title: 'Rebalancing empfohlen',
        confidence: 75,
        impact: 40,
        description: 'Portfolio sollte neu gewichtet werden für optimale Risk/Return'
      });
    }

    // Save recommendations
    for (const rec of recommendations) {
      await base44.asServiceRole.entities.AIRecommendation.create({
        portfolio_id: portfolioId,
        user_id: userId,
        recommendation_type: rec.type,
        title: rec.title,
        description: rec.description,
        confidence: rec.confidence,
        impact_score: rec.impact,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 Tage
      });
    }

    console.log(`Generated ${recommendations.length} recommendations`);

    return Response.json({
      success: true,
      recommendations_count: recommendations.length,
      recommendations
    });
  } catch (error) {
    console.error('AI recommendations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});