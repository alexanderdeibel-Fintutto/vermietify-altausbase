import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('[Price Update] Starting daily price update...');
    
    const assets = await base44.asServiceRole.entities.Asset.list();
    let updated = 0;
    let failed = 0;
    
    for (const asset of assets) {
      try {
        let price = null;
        
        if (asset.asset_class === "STOCK" || asset.asset_class === "ETF" || asset.asset_class === "MUTUAL_FUND") {
          // Alpha Vantage
          const apiKey = Deno.env.get("ALPHA_VANTAGE_KEY");
          if (!apiKey) {
            console.warn('[Price Update] ALPHA_VANTAGE_KEY not set');
            continue;
          }
          
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.symbol}&apikey=${apiKey}`
          );
          const data = await response.json();
          
          if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
            price = parseFloat(data["Global Quote"]["05. price"]);
          }
          
          // Rate limiting (5 calls/minute for free tier)
          await new Promise(resolve => setTimeout(resolve, 12000));
          
        } else if (asset.asset_class === "CRYPTO") {
          // CoinGecko
          const coinId = asset.symbol.toLowerCase();
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=eur`
          );
          const data = await response.json();
          
          if (data[coinId] && data[coinId].eur) {
            price = data[coinId].eur;
          }
          
        } else if (asset.asset_class === "GOLD" || asset.asset_class === "SILVER" || asset.asset_class === "PLATINUM") {
          // Metals-API
          const apiKey = Deno.env.get("METALS_API_KEY");
          if (!apiKey) {
            console.warn('[Price Update] METALS_API_KEY not set');
            continue;
          }
          
          const metalSymbol = asset.asset_class === "GOLD" ? "XAU" : 
                             asset.asset_class === "SILVER" ? "XAG" : "XPT";
          
          const response = await fetch(
            `https://metals-api.com/api/latest?access_key=${apiKey}&base=EUR&symbols=${metalSymbol}`
          );
          const data = await response.json();
          
          if (data.rates && data.rates[metalSymbol]) {
            price = 1 / data.rates[metalSymbol]; // Umrechnung EUR/Gramm
          }
        }
        
        if (price) {
          const currentValue = asset.quantity * price;
          
          await base44.asServiceRole.entities.Asset.update(asset.id, {
            current_price: price,
            current_value: currentValue,
            last_price_update: new Date().toISOString()
          });
          
          // Historischen Datenpunkt speichern
          await base44.asServiceRole.entities.AssetValuation.create({
            asset_id: asset.id,
            valuation_date: new Date().toISOString().split('T')[0],
            price: price,
            source: "API"
          });
          
          updated++;
          console.log(`[Price Update] Updated ${asset.name}: ${price}€`);
        }
      } catch (error) {
        failed++;
        console.error(`[Price Update] Failed for ${asset.name}:`, error.message);
      }
    }
    
    console.log(`[Price Update] Completed: ${updated} updated, ${failed} failed`);
    
    return Response.json({ 
      success: true, 
      updated,
      failed,
      total: assets.length 
    });
  } catch (error) {
    console.error('[Price Update] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});