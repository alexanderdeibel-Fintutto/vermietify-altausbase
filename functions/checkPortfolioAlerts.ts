import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Offene ungelesene Alerts
    const unreadAlerts = await base44.asServiceRole.entities.PortfolioAlert.filter({
      is_read: false
    });

    // Abgelaufene Alerts archivieren
    const now = new Date();
    for (const alert of unreadAlerts) {
      if (alert.expires_at && new Date(alert.expires_at) < now) {
        await base44.asServiceRole.entities.PortfolioAlert.update(alert.id, {
          is_resolved: true
        });
      }
    }

    // Portfolio-Wert Alerts prüfen
    const users = await base44.asServiceRole.entities.User.list();

    for (const user of users) {
      const portfolio = await base44.asServiceRole.entities.AssetPortfolio.filter({
        user_id: user.id,
        status: 'active'
      });

      if (portfolio.length === 0) continue;

      const totalValue = portfolio.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
      const totalInvested = portfolio.reduce((sum, a) => sum + (a.quantity * a.purchase_price), 0);
      const portfolioChange = ((totalValue - totalInvested) / totalInvested) * 100;

      // Portfolio-Wert Alert erstellen wenn >5% Änderung
      if (Math.abs(portfolioChange) > 5) {
        const existingAlert = await base44.asServiceRole.entities.PortfolioAlert.filter({
          user_id: user.id,
          asset_portfolio_id: null,
          alert_type: 'portfolio_change',
          is_resolved: false
        });

        if (existingAlert.length === 0) {
          await base44.asServiceRole.entities.PortfolioAlert.create({
            user_id: user.id,
            alert_type: 'portfolio_change',
            severity: Math.abs(portfolioChange) > 10 ? 'warning' : 'info',
            title: `Portfolio: ${portfolioChange > 0 ? '+' : ''}${portfolioChange.toFixed(1)}%`,
            message: `Ihr Portfolio hat sich um ${portfolioChange.toFixed(1)}% ${portfolioChange > 0 ? 'erhöht' : 'verringert'}.`,
            trigger_value: Math.abs(portfolioChange),
            current_value: totalValue,
            triggered_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    }

    return Response.json({
      success: true,
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('checkPortfolioAlerts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});