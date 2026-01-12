import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { asset_id, sell_quantity, sell_price } = await req.json();
    
    console.log(`[FIFO] Calculating for asset ${asset_id}, selling ${sell_quantity} @ ${sell_price}€`);
    
    // 1. Alle Käufe chronologisch
    const buys = await base44.entities.AssetTransaction.filter({
      asset_id,
      transaction_type: "BUY"
    });
    
    buys.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
    
    let remaining_to_sell = sell_quantity;
    let total_cost_basis = 0;
    let lots_used = [];
    
    for (const buy of buys) {
      if (remaining_to_sell <= 0) break;
      
      const quantity_from_this_lot = Math.min(buy.quantity, remaining_to_sell);
      const cost_from_this_lot = quantity_from_this_lot * buy.price_per_unit;
      const fees_portion = (quantity_from_this_lot / buy.quantity) * (buy.fees || 0);
      
      total_cost_basis += cost_from_this_lot + fees_portion;
      remaining_to_sell -= quantity_from_this_lot;
      
      lots_used.push({
        buy_date: buy.transaction_date,
        quantity: quantity_from_this_lot,
        price_per_unit: buy.price_per_unit,
        cost: cost_from_this_lot,
        fees: fees_portion
      });
    }
    
    const total_revenue = sell_quantity * sell_price;
    const gain_loss = total_revenue - total_cost_basis;
    
    // Prüfe Haltefrist (nur bei Krypto/Edelmetallen)
    const oldest_lot_date = new Date(lots_used[0]?.buy_date);
    const holding_period_days = (new Date() - oldest_lot_date) / (1000 * 60 * 60 * 24);
    const is_tax_free = holding_period_days > 365;
    
    console.log(`[FIFO] Result: ${gain_loss.toFixed(2)}€ gain/loss, tax-free: ${is_tax_free}`);
    
    return Response.json({
      gain_loss,
      is_tax_free,
      holding_period_days: Math.floor(holding_period_days),
      lots_used,
      total_cost_basis,
      total_revenue
    });
  } catch (error) {
    console.error('[FIFO] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});