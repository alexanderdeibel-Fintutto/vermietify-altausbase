import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { asset_id, sell_quantity, sell_price, sell_date } = await req.json();
    
    console.log(`[FIFO] Calculating for asset ${asset_id}, quantity ${sell_quantity}, price ${sell_price}`);
    
    // Alle Käufe des Assets abrufen, sortiert nach Datum (FIFO)
    const transactions = await base44.entities.AssetTransaction.filter({
      asset_id,
      transaction_type: "KAUF"
    });
    
    if (transactions.length === 0) {
      return Response.json({ error: 'Keine Käufe für dieses Asset vorhanden' }, { status: 400 });
    }
    
    // Bereits verkaufte Mengen berechnen
    const sales = await base44.entities.AssetTransaction.filter({
      asset_id,
      transaction_type: "VERKAUF"
    });
    
    // FIFO-Zuordnung
    let remainingToSell = sell_quantity;
    let totalAcquisitionCost = 0;
    let lots = [];
    let remainingTransactions = [...transactions].sort((a, b) => 
      new Date(a.transaction_date) - new Date(b.transaction_date)
    );
    
    // Bereits verkaufte Mengen pro Lot tracken
    const soldFromLots = {};
    for (const sale of sales) {
      if (!soldFromLots[sale.id]) soldFromLots[sale.id] = 0;
      soldFromLots[sale.id] += sale.quantity;
    }
    
    for (const purchase of remainingTransactions) {
      if (remainingToSell <= 0) break;
      
      const alreadySold = soldFromLots[purchase.id] || 0;
      const availableFromLot = purchase.quantity - alreadySold;
      
      if (availableFromLot <= 0) continue;
      
      const soldFromThisLot = Math.min(remainingToSell, availableFromLot);
      const costPerUnit = (purchase.total_amount + (purchase.fees || 0)) / purchase.quantity;
      const acquisitionCostForLot = soldFromThisLot * costPerUnit;
      
      // Haltedauer berechnen
      const purchaseDate = new Date(purchase.transaction_date);
      const saleDate = new Date(sell_date);
      const holdingPeriodDays = Math.floor((saleDate - purchaseDate) / (1000 * 60 * 60 * 24));
      
      lots.push({
        purchaseId: purchase.id,
        purchaseDate: purchase.transaction_date,
        quantity: soldFromThisLot,
        acquisitionCostPerUnit: Number(costPerUnit.toFixed(2)),
        acquisitionCostTotal: Number(acquisitionCostForLot.toFixed(2)),
        holdingPeriodDays: holdingPeriodDays,
        isTaxFree: holdingPeriodDays > 365
      });
      
      totalAcquisitionCost += acquisitionCostForLot;
      remainingToSell -= soldFromThisLot;
    }
    
    if (remainingToSell > 0) {
      return Response.json({ 
        error: `Nicht genug Anteile vorhanden. Benötigt: ${sell_quantity}, verfügbar: ${sell_quantity - remainingToSell}` 
      }, { status: 400 });
    }
    
    const sellProceeds = sell_quantity * sell_price;
    const realizedGainLoss = sellProceeds - totalAcquisitionCost;
    
    console.log(`[FIFO] Result: cost=${totalAcquisitionCost}, proceeds=${sellProceeds}, gain=${realizedGainLoss}`);
    
    return Response.json({
      acquisitionCost: Number(totalAcquisitionCost.toFixed(2)),
      realizedGainLoss: Number(realizedGainLoss.toFixed(2)),
      lots: lots,
      totalQuantity: sell_quantity
    });
  } catch (error) {
    console.error('[FIFO] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});