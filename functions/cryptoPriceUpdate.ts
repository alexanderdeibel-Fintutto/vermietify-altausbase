import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Crypto-Assets mit Auto-Updates
    const cryptoAssets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      asset_category: 'crypto',
      auto_update_enabled: true,
      status: 'active'
    });

    console.log(`Found ${cryptoAssets.length} crypto assets for price update`);

    const updates = [];
    const errors = [];

    // CoinGecko API
    const cryptoIds = cryptoAssets
      .map(a => a.api_symbol?.toLowerCase())
      .filter(Boolean)
      .join(',');

    if (cryptoIds) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=eur,usd`
        );
        const data = await response.json();

        for (const asset of cryptoAssets) {
          const cryptoId = asset.api_symbol?.toLowerCase();
          const priceData = data[cryptoId];

          if (priceData) {
            const newPrice = asset.currency === 'EUR' ? priceData.eur : priceData.usd;
            const oldPrice = asset.current_value;

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

            const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
            updates.push({
              asset_id: asset.id,
              name: asset.name,
              old_price: oldPrice,
              new_price: newPrice,
              change_percent: changePercent
            });
          }
        }
      } catch (error) {
        console.error('CoinGecko error:', error);
        errors.push({ source: 'coingecko', error: error.message });
      }
    }

    return Response.json({
      success: true,
      updated_count: updates.length,
      error_count: errors.length,
      updates,
      errors
    });
  } catch (error) {
    console.error('cryptoPriceUpdate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});