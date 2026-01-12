import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Checking portfolio alerts...');

    // Alle Portfolios
    const portfolios = await base44.asServiceRole.entities.Portfolio.list();

    for (const portfolio of portfolios) {
      // Alerts für dieses Portfolio
      const alerts = await base44.asServiceRole.entities.PortfolioAlert.filter({
        portfolio_id: portfolio.id,
        is_active: true
      });

      if (alerts.length === 0) continue;

      // Holdings laden
      const accounts = await base44.asServiceRole.entities.PortfolioAccount.filter({
        portfolio_id: portfolio.id
      });
      const accountIds = accounts.map(a => a.id);

      const allHoldings = await base44.asServiceRole.entities.AssetHolding.list();
      const holdings = allHoldings.filter(h => accountIds.includes(h.portfolio_account_id));

      // Alerts prüfen
      for (const alert of alerts) {
        const holding = holdings.find(h => h.asset_id === alert.asset_id);
        if (!holding) continue;

        const currentPrice = holding.current_price || 0;
        let triggered = false;
        let message = '';

        if (alert.alert_type === 'price_above' && currentPrice >= alert.threshold_value) {
          triggered = true;
          message = `${alert.asset_id} erreicht ${currentPrice} (Ziel: ${alert.threshold_value})`;
        } else if (alert.alert_type === 'price_below' && currentPrice <= alert.threshold_value) {
          triggered = true;
          message = `${alert.asset_id} fällt auf ${currentPrice} (Limit: ${alert.threshold_value})`;
        }

        if (triggered) {
          // Benachrichtigung senden
          await base44.asServiceRole.entities.PortfolioNotification.create({
            portfolio_id: portfolio.id,
            notification_type: 'price_alert',
            title: 'Kurs-Alarm',
            message,
            is_read: false,
            priority: 'high'
          });

          // Alert als ausgelöst markieren
          await base44.asServiceRole.entities.PortfolioAlert.update(alert.id, {
            last_triggered: new Date().toISOString(),
            is_active: false
          });

          console.log(`Alert triggered: ${message}`);
        }
      }
    }

    return Response.json({ success: true, message: 'Alerts checked' });
  } catch (error) {
    console.error('Alert check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});