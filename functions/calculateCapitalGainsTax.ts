import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { assetId, taxYear } = body;

    // Get all transactions for asset
    const transactions = await base44.asServiceRole.entities.AssetTransaction.filter({
      asset_id: assetId,
      tax_relevant: true
    });

    // FIFO calculation
    let gains = 0;
    let losses = 0;
    let fifoQueue = [];

    const sales = transactions.filter(t => t.transaction_type === 'SELL');

    for (const sale of sales) {
      let remainingQty = sale.quantity;

      // Match with oldest purchases (FIFO)
      while (remainingQty > 0 && fifoQueue.length > 0) {
        const purchase = fifoQueue[0];
        const qtyToMatch = Math.min(remainingQty, purchase.qty_remaining);

        const costBasis = purchase.price * qtyToMatch;
        const saleProceeds = sale.price_per_unit * qtyToMatch;
        const gainLoss = saleProceeds - costBasis;

        if (gainLoss > 0) {
          gains += gainLoss;
        } else {
          losses += Math.abs(gainLoss);
        }

        purchase.qty_remaining -= qtyToMatch;
        if (purchase.qty_remaining === 0) {
          fifoQueue.shift();
        }

        remainingQty -= qtyToMatch;
      }
    }

    // Tax calculation
    const gainsTax = gains * 0.25; // 25% Kapitalertragsteuer
    const soli = gainsTax * 0.055; // 5,5% Solidaritätszuschlag
    const churchTax = gainsTax * 0.09; // 9% Kirchensteuer (depends on state)

    const totalTax = gainsTax + soli + churchTax;

    return Response.json({
      gains,
      losses,
      taxableGain: Math.max(0, gains - losses),
      capitalGainsTax: gainsTax,
      solidarityTax: soli,
      churchTax: churchTax,
      totalTax: totalTax,
      netGain: gains - losses - totalTax
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});