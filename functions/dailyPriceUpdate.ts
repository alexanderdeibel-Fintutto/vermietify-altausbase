import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Liste alle Assets auf
    const assets = await base44.entities.Asset.list('-last_price_update', 1000);

    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const asset of assets) {
      try {
        let price = null;

        // Hole API-Keys
        const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_KEY');
        const coinGeckoKey = Deno.env.get('COINGECKO_KEY');

        if (asset.asset_class === 'STOCK' || asset.asset_class === 'ETF') {
          // Alpha Vantage
          if (!alphaVantageKey) {
            throw new Error('ALPHA_VANTAGE_KEY not configured');
          }

          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.symbol}&apikey=${alphaVantageKey}`
          );
          const data = await response.json();

          if (data['Global Quote'] && data['Global Quote']['05. price']) {
            price = parseFloat(data['Global Quote']['05. price']);
          }
        } else if (asset.asset_class === 'CRYPTO') {
          // CoinGecko
          const symbol = asset.symbol.toLowerCase();
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=eur`
          );
          const data = await response.json();

          if (data[symbol] && data[symbol].eur) {
            price = data[symbol].eur;
          }
        } else if (['GOLD', 'SILVER', 'PLATINUM'].includes(asset.asset_class)) {
          // Metals-API (nur weekly, nicht daily wegen Rate Limits)
          const metal_symbol = asset.asset_class === 'GOLD' ? 'XAU' : 
                              asset.asset_class === 'SILVER' ? 'XAG' : 'XPT';
          
          // Nur einmal pro Woche aktualisieren
          const lastUpdate = new Date(asset.last_price_update || 0);
          const daysSinceUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);
          
          if (daysSinceUpdate < 7) {
            continue; // Skip weekly update
          }

          const metalsKey = Deno.env.get('METALS_API_KEY');
          if (!metalsKey) {
            throw new Error('METALS_API_KEY not configured');
          }

          const response = await fetch(
            `https://metals-api.com/api/latest?access_key=${metalsKey}&base=EUR&symbols=${metal_symbol}`
          );
          const data = await response.json();

          if (data.rates && data.rates[metal_symbol]) {
            price = 1 / data.rates[metal_symbol]; // EUR pro Gramm
          }
        }

        if (price && price > 0) {
          // Update Asset
          const current_value = asset.quantity * price;

          await base44.entities.Asset.update(asset.id, {
            current_price: price,
            current_value,
            last_price_update: new Date().toISOString(),
          });

          // Speichere Valuation-Datenpunkt
          await base44.entities.AssetValuation.create({
            asset_id: asset.id,
            valuation_date: new Date().toISOString().split('T')[0],
            price,
            source: 'API',
          });

          updated++;
        } else {
          failed++;
          errors.push(`${asset.name}: Kurs konnte nicht abgerufen werden`);
        }
      } catch (error) {
        failed++;
        errors.push(`${asset.name}: ${error.message}`);
        console.error(`[Price Update] Error for ${asset.name}:`, error);
      }
    }

    console.log(`[Daily Price Update] Completed: ${updated} updated, ${failed} failed`);

    return Response.json({
      success: true,
      updated,
      failed,
      total: assets.length,
      errors: errors.slice(0, 10), // Top 10 errors
    });
  } catch (error) {
    console.error('[Daily Price Update] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});