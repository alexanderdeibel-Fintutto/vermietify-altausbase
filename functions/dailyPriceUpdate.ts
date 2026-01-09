import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    console.log("Starting daily price update...");

    // 1. Alle Positionen mit aktivierten Auto-Updates laden
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      auto_update_enabled: true,
      status: 'active'
    }, '-created_date', 1000);

    console.log(`Found ${assets?.length || 0} assets for price update`);

    const updates = [];
    const errors = [];
    let totalApiCalls = 0;

    if (!assets || assets.length === 0) {
      return Response.json({ success: true, message: 'No assets to update', updates: [] });
    }

    // 2. Group by API source
    const assetsBySource = {
      yahoo_finance: [],
      coingecko: [],
      manual: []
    };

    for (const asset of assets) {
      if (asset.api_symbol) {
        if (asset.asset_category === 'crypto') {
          assetsBySource.coingecko.push(asset);
        } else {
          assetsBySource.yahoo_finance.push(asset);
        }
      }
    }

    // 3. Update prices via Yahoo Finance
    if (assetsBySource.yahoo_finance.length > 0) {
      try {
        console.log(`Updating ${assetsBySource.yahoo_finance.length} stocks/etfs via Yahoo Finance`);
        
        for (const asset of assetsBySource.yahoo_finance.slice(0, 50)) { // Batch limit
          try {
            const symbol = asset.api_symbol || asset.isin;
            if (!symbol) continue;

            const response = await fetch(
              `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`
            );
            
            if (!response.ok) continue;
            
            const data = await response.json();
            const price = data.quoteSummary?.result?.[0]?.price?.regularMarketPrice;

            if (price) {
              const oldPrice = asset.current_value;
              const newPrice = price;
              const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;

              // Update asset
              await base44.asServiceRole.entities.AssetPortfolio.update(asset.id, {
                current_value: newPrice,
                last_price_update: new Date().toISOString(),
                price_source: 'yahoo_finance'
              });

              // Store price history
              await base44.asServiceRole.entities.PriceHistory.create({
                asset_portfolio_id: asset.id,
                price: newPrice,
                source: 'yahoo_finance',
                currency: asset.currency,
                recorded_at: new Date().toISOString()
              });

              updates.push({
                asset_id: asset.id,
                name: asset.name,
                old_price: oldPrice,
                new_price: newPrice,
                change_percent: changePercent
              });

              // Create alert for significant changes
              if (Math.abs(changePercent) > 20) {
                await base44.asServiceRole.entities.PortfolioAlert.create({
                  user_id: asset.user_id,
                  asset_portfolio_id: asset.id,
                  alert_type: 'price_change',
                  severity: Math.abs(changePercent) > 30 ? 'critical' : 'warning',
                  title: `${asset.name}: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
                  message: `Der Kurs von ${asset.name} ist um ${Math.abs(changePercent).toFixed(1)}% ${changePercent >= 0 ? 'gestiegen' : 'gefallen'}.`,
                  trigger_value: Math.abs(changePercent),
                  current_value: newPrice,
                  action_required: Math.abs(changePercent) > 30,
                  triggered_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });
              }

              totalApiCalls++;
            }
          } catch (assetError) {
            console.warn(`Failed to update ${asset.name}:`, assetError.message);
          }
        }
      } catch (error) {
        console.error("Yahoo Finance update failed:", error);
        errors.push({ source: 'yahoo_finance', error: error.message });
      }
    }

    // 4. Update crypto prices via CoinGecko
    if (assetsBySource.coingecko.length > 0) {
      try {
        console.log(`Updating ${assetsBySource.coingecko.length} crypto assets via CoinGecko`);
        
        for (const asset of assetsBySource.coingecko.slice(0, 50)) {
          try {
            const cryptoId = asset.api_symbol?.toLowerCase() || asset.name.toLowerCase();
            
            const response = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=eur,usd&include_24hr_change=true`
            );
            
            if (!response.ok) continue;
            
            const data = await response.json();
            const priceData = data[cryptoId];

            if (priceData) {
              const newPrice = asset.currency === 'EUR' ? priceData.eur : priceData.usd;
              const oldPrice = asset.current_value;
              const change24h = asset.currency === 'EUR' ? priceData.eur_24h_change : priceData.usd_24h_change;

              await base44.asServiceRole.entities.AssetPortfolio.update(asset.id, {
                current_value: newPrice,
                last_price_update: new Date().toISOString(),
                price_source: 'coingecko'
              });

              await base44.asServiceRole.entities.PriceHistory.create({
                asset_portfolio_id: asset.id,
                price: newPrice,
                source: 'coingecko',
                currency: asset.currency,
                recorded_at: new Date().toISOString()
              });

              updates.push({
                asset_id: asset.id,
                name: asset.name,
                old_price: oldPrice,
                new_price: newPrice,
                change_percent: change24h || 0
              });

              totalApiCalls++;
            }
          } catch (assetError) {
            console.warn(`Failed to update ${asset.name}:`, assetError.message);
          }
        }
      } catch (error) {
        console.error("CoinGecko update failed:", error);
        errors.push({ source: 'coingecko', error: error.message });
      }
    }

    console.log(`Price update completed: ${updates.length} updates, ${errors.length} errors`);

    return Response.json({
      success: true,
      updated_count: updates.length,
      error_count: errors.length,
      total_api_calls: totalApiCalls,
      updates: updates,
      errors: errors
    });
  } catch (error) {
    console.error("Daily price update error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});