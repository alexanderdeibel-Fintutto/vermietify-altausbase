import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Starting price alert checks...');

    // Get all active portfolios
    const portfolios = await base44.asServiceRole.entities.AssetPortfolio.filter({
      status: 'active'
    });

    const alerts = [];

    for (const portfolio of portfolios) {
      if (!portfolio.auto_update_enabled) continue;

      const changePercent = ((portfolio.current_value - portfolio.purchase_price) / portfolio.purchase_price) * 100;

      // Alert on significant changes
      if (Math.abs(changePercent) > 20) {
        const severity = Math.abs(changePercent) > 30 ? 'critical' : 'warning';
        
        await base44.functions.invoke('sendPortfolioNotification', {
          userId: portfolio.user_id,
          type: 'price_alert',
          title: `${portfolio.name}: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
          message: `Position um ${Math.abs(changePercent).toFixed(1)}% ${changePercent > 0 ? 'gestiegen' : 'gefallen'}`,
          severity,
          channels: ['in_app', 'email']
        });

        alerts.push({ portfolio_id: portfolio.id, change: changePercent });
      }
    }

    return Response.json({
      success: true,
      alerts_triggered: alerts.length,
      message: `${alerts.length} Price Alerts versendet`
    });
  } catch (error) {
    console.error('Price alert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});