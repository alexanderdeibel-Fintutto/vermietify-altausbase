import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log("Starting crypto price update...");

    // 1. Alle Crypto-Positionen laden
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      asset_category: "CRYPTO",
      auto_update_enabled: true,
      status: "active"
    });

    console.log(`Found ${assets.length} crypto assets`);

    const updates = [];
    const errors = [];

    // 2. CoinGecko Updates (Kryptowährungen)
    try {
      const cryptoIds = assets
        .filter(a => a.api_symbol)
        .map(a => a.api_symbol.toLowerCase())
        .slice(0, 250);

      if (cryptoIds.length === 0) {
        return Response.json({ success: true, updated_count: 0 });
      }

      const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=eur,usd`;

      const coingeckoResponse = await fetch(coingeckoUrl);

      if (!coingeckoResponse.ok) {
        throw new Error(`CoinGecko API error: ${coingeckoResponse.status}`);
      }

      const coingeckoData = await coingeckoResponse.json();

      for (const asset of assets) {
        const cryptoId = asset.api_symbol?.toLowerCase();
        if (!cryptoId || !coingeckoData[cryptoId]) continue;

        try {
          const priceData = coingeckoData[cryptoId];
          const newPrice = asset.currency === "EUR" ? priceData.eur : priceData.usd;

          if (!newPrice) continue;

          const oldPrice = asset.current_value;

          await base44.asServiceRole.entities.AssetPortfolio.update(asset.id, {
            current_value: newPrice,
            last_price_update: new Date().toISOString()
          });

          await base44.asServiceRole.entities.PriceHistory.create({
            asset_portfolio_id: asset.id,
            price: newPrice,
            source: "coingecko",
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

          // Alert für volatile Crypto-Bewegungen
          if (Math.abs(changePercent) > 15) {
            const severity = Math.abs(changePercent) > 25 ? "critical" : "warning";
            await base44.asServiceRole.entities.PortfolioAlert.create({
              user_id: asset.user_id,
              asset_portfolio_id: asset.id,
              alert_type: "price_change",
              severity,
              title: `${asset.name}: ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`,
              message: `Kryptowährung ${asset.name} hat sich um ${Math.abs(changePercent).toFixed(1)}% ${changePercent > 0 ? "erhöht" : "verringert"}.`,
              trigger_value: Math.abs(changePercent),
              current_value: newPrice,
              triggered_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        } catch (e) {
          console.error(`Error updating ${asset.api_symbol}:`, e.message);
        }
      }
    } catch (error) {
      console.error("CoinGecko update failed:", error);
      errors.push({ source: "coingecko", error: error.message });
    }

    return Response.json({
      success: true,
      updated_count: updates.length,
      error_count: errors.length
    });
  } catch (error) {
    console.error("cryptoPriceUpdate error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});