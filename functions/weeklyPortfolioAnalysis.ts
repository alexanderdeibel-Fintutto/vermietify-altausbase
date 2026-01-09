import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Alle aktiven Assets
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      status: 'active'
    });

    const analysis = {
      total_value: 0,
      total_invested: 0,
      portfolio_changes: [],
      diversification_warnings: [],
      concentration_alerts: []
    };

    // Portfolio-Metriken berechnen
    for (const asset of assets) {
      const totalValue = asset.quantity * asset.current_value;
      const totalInvested = asset.quantity * asset.purchase_price;
      const gain = totalValue - totalInvested;
      const gainPercent = (gain / totalInvested) * 100;

      analysis.total_value += totalValue;
      analysis.total_invested += totalInvested;
      analysis.portfolio_changes.push({
        asset_id: asset.id,
        asset_name: asset.name,
        value: totalValue,
        gain: gain,
        gain_percent: gainPercent
      });
    }

    // Konzentration prüfen
    for (const change of analysis.portfolio_changes) {
      const concentration = (change.value / analysis.total_value) * 100;
      if (concentration > 20) {
        analysis.concentration_alerts.push({
          asset_id: change.asset_id,
          asset_name: change.asset_name,
          concentration_percent: concentration,
          message: `${change.asset_name} macht ${concentration.toFixed(1)}% des Portfolios aus`
        });
      }
    }

    // Diversifikation prüfen
    const categories = {};
    for (const asset of assets) {
      const cat = asset.asset_category;
      if (!categories[cat]) categories[cat] = 0;
      categories[cat] += asset.quantity * asset.current_value;
    }

    const categoryCount = Object.keys(categories).length;
    if (categoryCount < 3) {
      analysis.diversification_warnings.push({
        message: `Portfolio hat nur ${categoryCount} Kategorien. Bessere Diversifikation empfohlen.`,
        severity: 'warning'
      });
    }

    return Response.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('weeklyPortfolioAnalysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});