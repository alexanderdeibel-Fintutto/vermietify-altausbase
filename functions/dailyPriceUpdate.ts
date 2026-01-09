import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Alle Positionen mit aktivierten Auto-Updates laden
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      auto_update_enabled: true,
      status: 'active'
    });

    console.log(`Found ${assets.length} assets for price update`);

    const updates = [];
    const errors = [];

    // 2. Nach API-Source gruppieren
    const assetsBySource = {};
    for (const asset of assets) {
      const source = asset.price_source || 'yahoo_finance';
      if (!assetsBySource[source]) assetsBySource[source] = [];
      assetsBySource[source].push(asset);
    }

    // 3. Yahoo Finance Updates
    if (assetsBySource.yahoo_finance?.length > 0) {
      try {
        const symbols = assetsBySource.yahoo_finance
          .map(a => a.api_symbol)
          .filter(Boolean)
          .join(',');

        if (symbols) {
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbols}?interval=1d&range=1d`
          );
          const data = await response.json();

          for (const asset of assetsBySource.yahoo_finance) {
            try {
              const result = data.chart?.result?.find(r => r.meta?.symbol === asset.api_symbol);
              if (result?.meta?.regularMarketPrice) {
                const newPrice = result.meta.regularMarketPrice;
                const oldPrice = asset.current_value;

                await base44.asServiceRole.entities.AssetPortfolio.update(asset.id, {
                  current_value: newPrice,
                  last_price_update: new Date().toISOString(),
                  price_source: 'yahoo_finance'
                });

                await base44.asServiceRole.entities.PriceHistory.create({
                  asset_portfolio_id: asset.id,
                  price: newPrice,
                  source: 'yahoo_finance',
                  currency: asset.currency,
                  recorded_at: new Date().toISOString()
                });

                const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
                updates.push({
                  asset_id: asset.id,
                  name: asset.name,
                  old_price: oldPrice,
                  new_price: newPrice,
                  change_percent: changePercent
                });

                // Alert bei großen Änderungen
                if (Math.abs(changePercent) > 20) {
                  await base44.asServiceRole.entities.PortfolioAlert.create({
                    user_id: asset.user_id,
                    asset_portfolio_id: asset.id,
                    alert_type: 'price_change',
                    severity: Math.abs(changePercent) > 30 ? 'critical' : 'warning',
                    title: `${asset.name}: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
                    message: `Kurs von ${asset.name} ist um ${changePercent.toFixed(1)}% ${changePercent > 0 ? 'gestiegen' : 'gefallen'}.`,
                    trigger_value: Math.abs(changePercent),
                    current_value: newPrice,
                    action_required: Math.abs(changePercent) > 30,
                    triggered_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                  });
                }
              }
            } catch (e) {
              errors.push({ asset_id: asset.id, error: e.message });
            }
          }
        }
      } catch (error) {
        console.error('Yahoo Finance error:', error);
        errors.push({ source: 'yahoo_finance', error: error.message });
      }
    }

    // 4. Log Activity
    await base44.asServiceRole.entities.ActivityLog.create({
      user_id: 'system',
      action: 'daily_price_update_completed',
      entity_type: 'AssetPortfolio',
      details: { updated_count: updates.length, error_count: errors.length }
    });

    return Response.json({
      success: true,
      updated_count: updates.length,
      error_count: errors.length,
      updates,
      errors
    });
  } catch (error) {
    console.error('dailyPriceUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});