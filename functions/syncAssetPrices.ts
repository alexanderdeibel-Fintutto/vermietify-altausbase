import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ALPHA_VANTAGE_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

async function fetchStockPrice(symbol) {
  if (!ALPHA_VANTAGE_KEY) return null;
  
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      return {
        price: parseFloat(data['Global Quote']['05. price']),
        date: data['Global Quote']['07. latest trading day']
      };
    }
  } catch (error) {
    console.error(`Alpha Vantage error for ${symbol}:`, error);
  }
  return null;
}

async function fetchCryptoPrice(symbol) {
  try {
    const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 
                   symbol.toLowerCase() === 'eth' ? 'ethereum' : symbol.toLowerCase();
    const url = `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=eur`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data[coinId] && data[coinId].eur) {
      return {
        price: data[coinId].eur,
        date: new Date().toISOString().split('T')[0]
      };
    }
  } catch (error) {
    console.error(`CoinGecko error for ${symbol}:`, error);
  }
  return null;
}

async function fetchYahooPrice(symbol) {
  try {
    // Yahoo Finance API (inoffiziell)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      return {
        price: meta.regularMarketPrice,
        date: new Date().toISOString().split('T')[0]
      };
    }
  } catch (error) {
    console.error(`Yahoo error for ${symbol}:`, error);
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { assetId } = body;

    // Filter: Nur spezifisches Asset oder alle aktiven
    const filter = assetId 
      ? { id: assetId } 
      : { is_actively_traded: true };
    
    const assets = await base44.entities.Asset.filter(filter);
    console.log(`Synchronisiere ${assets.length} Assets...`);

    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    const today = new Date().toISOString().split('T')[0];

    for (const asset of assets) {
      try {
        let priceData = null;

        // Asset-Klassen-spezifischer API-Call
        if (asset.asset_class === 'crypto') {
          priceData = await fetchCryptoPrice(asset.symbol);
        } else if (['stock', 'etf'].includes(asset.asset_class)) {
          priceData = await fetchStockPrice(asset.symbol);
          if (!priceData) {
            priceData = await fetchYahooPrice(asset.symbol);
          }
        }

        if (!priceData) {
          results.failed++;
          results.errors.push({ asset: asset.symbol, error: 'Kein Preis verfügbar' });
          continue;
        }

        // Speichere in AssetPrice
        await base44.entities.AssetPrice.create({
          asset_id: asset.id,
          price_date: priceData.date,
          close_price: priceData.price,
          source: asset.asset_class === 'crypto' ? 'coingecko' : 'alpha_vantage'
        });

        // Aktualisiere Holdings
        const holdings = await base44.entities.AssetHolding.filter({ asset_id: asset.id });
        for (const holding of holdings) {
          const currentValue = holding.quantity * priceData.price;
          const unrealizedGL = currentValue - holding.total_cost_basis;
          const unrealizedGLPercent = (unrealizedGL / holding.total_cost_basis) * 100;

          await base44.entities.AssetHolding.update(holding.id, {
            current_price: priceData.price,
            current_value: currentValue,
            unrealized_gain_loss: unrealizedGL,
            unrealized_gain_loss_percent: unrealizedGLPercent,
            last_price_update: new Date().toISOString()
          });
        }

        results.updated++;
        
        // Rate Limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error syncing ${asset.symbol}:`, error);
        results.failed++;
        results.errors.push({ asset: asset.symbol, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `${results.updated} aktualisiert, ${results.failed} fehlgeschlagen`,
      results
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});