import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log("Starting daily price update...");

    // 1. Alle Positionen mit aktivierten Auto-Updates laden
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      auto_update_enabled: true,
      status: "active"
    });

    console.log(`Found ${assets.length} assets for price update`);

    const updates = [];
    const errors = [];

    // 2. Nach API-Source gruppieren
    const assetsBySource = {};
    for (const asset of assets) {
      const source = asset.price_source || "yahoo_finance";
      if (!assetsBySource[source]) assetsBySource[source] = [];
      assetsBySource[source].push(asset);
    }

    // 3. Yahoo Finance Updates (Aktien, ETFs)
    if (assetsBySource.yahoo_finance?.length > 0) {
      try {
        const symbols = assetsBySource.yahoo_finance
          .filter(a => a.api_symbol)
          .map(a => a.api_symbol)
          .slice(0, 10)
          .join(",");

        if (symbols) {
          const yahooResponse = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbols}?interval=1d&range=1d`,
            { headers: { "User-Agent": "Mozilla/5.0" } }
          );

          if (yahooResponse.ok) {
            const yahooData = await yahooResponse.json();

            for (const asset of assetsBySource.yahoo_finance) {
              if (!asset.api_symbol) continue;

              try {
                const priceData = yahooData.chart?.result?.find(
                  r => r.meta.symbol === asset.api_symbol
                );

                if (priceData?.meta?.regularMarketPrice) {
                  const newPrice = priceData.meta.regularMarketPrice;
                  const oldPrice = asset.current_value;

                  await base44.asServiceRole.entities.AssetPortfolio.update(asset.id, {
                    current_value: newPrice,
                    last_price_update: new Date().toISOString()
                  });

                  await base44.asServiceRole.entities.PriceHistory.create({
                    asset_portfolio_id: asset.id,
                    price: newPrice,
                    source: "yahoo_finance",
                    currency: asset.currency,
                    recorded_at: new Date().toISOString()
                  });

                  const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
                  updates.push({
                    asset_id: asset.id,
                    old_price: oldPrice,
                    new_price: newPrice,
                    change_percent: changePercent
                  });

                  // Alert bei großen Änderungen
                  if (Math.abs(changePercent) > 20) {
                    const severity = Math.abs(changePercent) > 30 ? "critical" : "warning";
                    await base44.asServiceRole.entities.PortfolioAlert.create({
                      user_id: asset.user_id,
                      asset_portfolio_id: asset.id,
                      alert_type: "price_change",
                      severity,
                      title: `${asset.name}: ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`,
                      message: `Der Kurs ist von €${oldPrice.toFixed(2)} auf €${newPrice.toFixed(2)} ${changePercent > 0 ? "gestiegen" : "gefallen"}.`,
                      trigger_value: Math.abs(changePercent),
                      current_value: newPrice,
                      triggered_at: new Date().toISOString(),
                      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    });
                  }
                }
              } catch (e) {
                console.error(`Error updating ${asset.api_symbol}:`, e.message);
              }
            }
          }
        }
      } catch (error) {
        console.error("Yahoo Finance update failed:", error);
        errors.push({ source: "yahoo_finance", error: error.message });
      }
    }

    // 4. ActivityLog erstellen
    await base44.asServiceRole.entities.ActivityLog.create({
      user_id: "system",
      action: "daily_price_update_completed",
      entity_type: "AssetPortfolio",
      details: {
        updated_count: updates.length,
        error_count: errors.length,
        errors
      }
    });

    console.log(`Price update completed: ${updates.length} updates, ${errors.length} errors`);

    return Response.json({
      success: true,
      updated_count: updates.length,
      error_count: errors.length
    });
  } catch (error) {
    console.error("dailyPriceUpdate error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});