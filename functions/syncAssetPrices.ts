import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const assets = await base44.asServiceRole.entities.Asset.list();
    const results = [];

    for (const asset of assets) {
      let price = null;
      let source = asset.api_source || 'MANUAL';

      // Stocks/ETFs - Alpha Vantage
      if (['STOCK', 'ETF', 'MUTUAL_FUND'].includes(asset.asset_class) && asset.symbol) {
        try {
          const apiKey = Deno.env.get('ALPHA_VANTAGE_KEY');
          const res = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.symbol}&apikey=${apiKey}`
          );
          const data = await res.json();
          price = parseFloat(data['Global Quote']?.['05. price'] || 0);
        } catch (e) {
          console.error('Alpha Vantage error:', e);
        }
      }

      // Crypto - CoinGecko
      if (asset.asset_class === 'CRYPTO' && asset.symbol) {
        try {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${asset.symbol.toLowerCase()}&vs_currencies=eur`
          );
          const data = await res.json();
          price = data[asset.symbol.toLowerCase()]?.eur || null;
        } catch (e) {
          console.error('CoinGecko error:', e);
        }
      }

      // Metals - Metals-API
      if (['GOLD', 'SILVER', 'PLATINUM'].includes(asset.asset_class)) {
        try {
          const metalMap = { GOLD: 'XAU', SILVER: 'XAG', PLATINUM: 'XPT' };
          const res = await fetch(
            `https://metals-api.com/api/latest?base=EUR&symbols=${metalMap[asset.asset_class]}&access_key=${Deno.env.get('METALS_API_KEY')}`
          );
          const data = await res.json();
          price = data.rates?.[metalMap[asset.asset_class]] || null;
        } catch (e) {
          console.error('Metals-API error:', e);
        }
      }

      // Update asset
      if (price) {
        await base44.asServiceRole.entities.Asset.update(asset.id, {
          current_price: price,
          last_price_update: new Date().toISOString()
        });

        // Record valuation
        await base44.asServiceRole.entities.AssetValuation.create({
          asset_id: asset.id,
          valuation_date: new Date().toISOString().split('T')[0],
          price: price,
          source: 'API'
        });

        results.push({ asset: asset.name, price, status: 'OK' });
      }
    }

    return Response.json({ success: true, updated: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});