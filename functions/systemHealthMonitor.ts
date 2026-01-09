import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      components: {},
      metrics: {},
      alerts: []
    };

    // 1. Check API availability
    try {
      const yahooTest = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1d');
      health.components.yahoo_finance = yahooTest.ok ? 'operational' : 'degraded';
      if (!yahooTest.ok) health.alerts.push('Yahoo Finance API slow/unavailable');
    } catch (e) {
      health.components.yahoo_finance = 'down';
      health.alerts.push('Yahoo Finance API is down');
    }

    try {
      const coinTest = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
      health.components.coingecko = coinTest.ok ? 'operational' : 'degraded';
      if (!coinTest.ok) health.alerts.push('CoinGecko API slow/unavailable');
    } catch (e) {
      health.components.coingecko = 'down';
      health.alerts.push('CoinGecko API is down');
    }

    // 2. Check database connectivity
    try {
      const testAsset = await base44.asServiceRole.entities.AssetPortfolio.list(undefined, 1);
      health.components.database = 'operational';
    } catch (e) {
      health.components.database = 'down';
      health.alerts.push('Database connection failed');
    }

    // 3. Database metrics
    try {
      const assetCount = await base44.asServiceRole.entities.AssetPortfolio.filter({});
      const alertCount = await base44.asServiceRole.entities.PortfolioAlert.filter({});
      const priceHistoryCount = await base44.asServiceRole.entities.PriceHistory.filter({});

      health.metrics.total_assets = assetCount.length;
      health.metrics.open_alerts = alertCount.filter(a => !a.is_resolved).length;
      health.metrics.price_history_records = priceHistoryCount.length;
    } catch (e) {
      console.error('Metrics collection error:', e);
    }

    // 4. Check last updates
    try {
      const recentUpdates = await base44.asServiceRole.entities.ActivityLog.filter(
        { action: 'daily_price_update_completed' },
        '-created_date',
        1
      );

      if (recentUpdates.length > 0) {
        const lastUpdate = new Date(recentUpdates[0].created_date);
        const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        health.metrics.hours_since_last_price_update = hoursAgo.toFixed(1);

        if (hoursAgo > 24) {
          health.alerts.push('Price updates have not run in >24 hours');
          health.status = 'degraded';
        }
      }
    } catch (e) {
      console.error('Last update check error:', e);
    }

    // 5. Overall status
    if (health.alerts.length > 0) {
      health.status = health.alerts.some(a => a.includes('down')) ? 'critical' : 'degraded';
    }

    return Response.json(health);
  } catch (error) {
    console.error('systemHealthMonitor error:', error);
    return Response.json({
      status: 'critical',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});