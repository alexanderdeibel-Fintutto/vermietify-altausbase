import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log("Starting weekly portfolio analysis...");

    // 1. Alle Portfolios mit aktiven Positionen
    const allAssets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      status: "active"
    });

    // 2. Nach User gruppieren
    const assetsByUser = {};
    for (const asset of allAssets) {
      if (!assetsByUser[asset.user_id]) {
        assetsByUser[asset.user_id] = [];
      }
      assetsByUser[asset.user_id].push(asset);
    }

    console.log(`Analyzing ${Object.keys(assetsByUser).length} user portfolios`);

    // 3. Pro User: Analyse durchführen
    for (const [userId, userAssets] of Object.entries(assetsByUser)) {
      try {
        const totalValue = userAssets.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
        const totalInvested = userAssets.reduce((sum, a) => sum + (a.quantity * a.purchase_price), 0);
        const totalGain = totalValue - totalInvested;
        const gainPercent = (totalGain / totalInvested) * 100;

        // Kategorie-Verteilung
        const categoryDistribution = {};
        for (const asset of userAssets) {
          const cat = asset.asset_category;
          if (!categoryDistribution[cat]) {
            categoryDistribution[cat] = 0;
          }
          categoryDistribution[cat] += (asset.quantity * asset.current_value) / totalValue;
        }

        // Diversifikations-Score
        const diversificationScore = Math.min(
          100,
          (Object.keys(categoryDistribution).length / 9) * 100
        );

        // Top/Flop Positionen
        const sortedAssets = [...userAssets].sort(
          (a, b) => (((b.current_value - b.purchase_price) / b.purchase_price) * 100) -
                    (((a.current_value - a.purchase_price) / a.purchase_price) * 100)
        );

        const topPerformers = sortedAssets.slice(0, 3);
        const worstPerformers = sortedAssets.slice(-3);

        // Alerts für Rebalancing-Empfehlungen
        if (diversificationScore < 50) {
          await base44.asServiceRole.entities.PortfolioAlert.create({
            user_id: userId,
            alert_type: "rebalancing",
            severity: "info",
            title: "Portfolio-Diversifikation niedrig",
            message: `Ihr Diversifikations-Score liegt bei ${diversificationScore.toFixed(0)}%. Erwägen Sie eine stärkere Verteilung über verschiedene Kategorien.`,
            trigger_value: diversificationScore,
            current_value: diversificationScore,
            triggered_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        }

        // Alert für hohe Konzentration (>30% in einer Position)
        for (const asset of userAssets) {
          const concentration = (asset.quantity * asset.current_value) / totalValue * 100;
          if (concentration > 30) {
            await base44.asServiceRole.entities.PortfolioAlert.create({
              user_id: userId,
              asset_portfolio_id: asset.id,
              alert_type: "portfolio_change",
              severity: "warning",
              title: `Hohe Konzentration: ${asset.name}`,
              message: `${asset.name} macht ${concentration.toFixed(1)}% Ihres Portfolios aus. Überprüfen Sie das Risiko.`,
              trigger_value: concentration,
              current_value: concentration,
              triggered_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }

        // Log Analytics
        await base44.asServiceRole.entities.ActivityLog.create({
          user_id: userId,
          action: "weekly_portfolio_analysis_completed",
          entity_type: "AssetPortfolio",
          details: {
            total_value: totalValue,
            total_gain: totalGain,
            gain_percent: gainPercent,
            diversification_score: diversificationScore,
            position_count: userAssets.length,
            category_count: Object.keys(categoryDistribution).length
          }
        });

        console.log(`Portfolio analysis for ${userId}: Total €${totalValue.toFixed(2)}, Gain ${gainPercent.toFixed(1)}%`);
      } catch (error) {
        console.error(`Error analyzing portfolio for ${userId}:`, error);
      }
    }

    return Response.json({
      success: true,
      analyzed_users: Object.keys(assetsByUser).length
    });
  } catch (error) {
    console.error("weeklyPortfolioAnalysis error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});