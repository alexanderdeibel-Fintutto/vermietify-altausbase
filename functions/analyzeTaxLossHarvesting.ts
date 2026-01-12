import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const suggestions = [];
    
    // Stocks analysieren
    const stocks = await base44.entities.Stock.list();
    const assets = await base44.entities.Asset.list();
    
    for (const asset of assets) {
      if (!asset.portfolio_id) continue;
      
      if (asset.quantity <= 0) continue;
      
      const currentValue = asset.quantity * (asset.current_price || 0);
      const acquisitionCost = asset.purchase_price_avg * asset.quantity;
      const unrealizedGainLoss = currentValue - acquisitionCost;
      
      // Nur Verluste anzeigen, min 100€
      if (unrealizedGainLoss >= -100) continue;
      
      const taxSavings = Math.abs(unrealizedGainLoss) * 0.26375; // KESt + Soli
      
      // Prüfen ob kürzlich verkauft (Wash Sale)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSales = await base44.entities.AssetTransaction.filter({
        asset_id: asset.id,
        transaction_type: "VERKAUF",
        transaction_date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] }
      });
      
      suggestions.push({
        asset_id: asset.id,
        asset_name: asset.name,
        asset_class: asset.asset_class,
        current_quantity: asset.quantity,
        current_price: asset.current_price || 0,
        acquisition_cost: Number(acquisitionCost.toFixed(2)),
        current_value: Number(currentValue.toFixed(2)),
        unrealized_loss: Number(unrealizedGainLoss.toFixed(2)),
        tax_savings_estimate: Number(taxSavings.toFixed(2)),
        wash_sale_warning: recentSales.length > 0,
        priority: Math.abs(unrealizedGainLoss) > 1000 ? "HIGH" : "MEDIUM"
      });
    }
    
    // Sortieren nach Steuerersparnis
    suggestions.sort((a, b) => b.tax_savings_estimate - a.tax_savings_estimate);
    
    console.log(`[TLH] Found ${suggestions.length} candidates`);
    
    return Response.json({ suggestions, count: suggestions.length });
  } catch (error) {
    console.error('[TLH] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});