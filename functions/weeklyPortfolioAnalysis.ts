import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Starting weekly portfolio analysis...');

    // Get all active users with portfolios
    const users = await base44.asServiceRole.entities.User.list();
    let analyzed = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Get user's portfolio
        const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
          user_id: user.id,
          status: 'active'
        });

        if (assets.length === 0) continue;

        // Calculate metrics
        const totalValue = assets.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
        const totalInvested = assets.reduce((sum, a) => sum + (a.quantity * a.purchase_price), 0);
        const totalGains = totalValue - totalInvested;
        const gainPercent = (totalGains / totalInvested) * 100;

        // Category breakdown
        const allocation = {};
        assets.forEach(asset => {
          allocation[asset.asset_category] = (allocation[asset.asset_category] || 0) + (asset.quantity * asset.current_value);
        });

        // Diversification check
        const categoryCount = Object.keys(allocation).length;
        const diversificationScore = Math.min(100, (categoryCount / 10) * 100);

        // Get recent performance data
        const priceHistory = await base44.asServiceRole.entities.PriceHistory.filter({
          asset_portfolio_id: assets[0].id
        }, '-recorded_at', 5);

        let weeklyChange = 0;
        if (priceHistory.length >= 2) {
          const oldPrice = priceHistory[priceHistory.length - 1].price;
          const newPrice = priceHistory[0].price;
          weeklyChange = ((newPrice - oldPrice) / oldPrice) * 100;
        }

        // Create insights
        const insights = [];

        if (gainPercent > 20) {
          insights.push({
            type: 'positive',
            title: 'Starke Performance',
            message: `Portfolio mit +${gainPercent.toFixed(1)}% im Plus`
          });
        } else if (gainPercent < -10) {
          insights.push({
            type: 'warning',
            title: 'Portfolio im Minus',
            message: `Aktuell ${gainPercent.toFixed(1)}% im Minus - Rebalancing erwägen`
          });
        }

        if (diversificationScore < 40) {
          insights.push({
            type: 'warning',
            title: 'Schwache Diversifikation',
            message: `Nur ${categoryCount} Kategorien - mehr Streuung empfohlen`
          });
        }

        // Send notifications for insights
        for (const insight of insights) {
          await base44.functions.invoke('sendPortfolioNotification', {
            userId: user.id,
            type: 'portfolio_update',
            title: insight.title,
            message: insight.message,
            severity: insight.type === 'warning' ? 'warning' : 'info',
            channels: ['in_app', 'email']
          });
        }

        analyzed++;
      } catch (userError) {
        console.error(`Error analyzing portfolio for user ${user.id}:`, userError);
        errors++;
      }
    }

    console.log(`Weekly analysis completed: ${analyzed} analyzed, ${errors} errors`);

    return Response.json({
      success: true,
      analyzed,
      errors,
      message: `Wöchentliche Analyse für ${analyzed} Portfolios durchgeführt`
    });
  } catch (error) {
    console.error('Weekly portfolio analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});