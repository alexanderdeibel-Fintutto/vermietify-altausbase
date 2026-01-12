import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { assetId } = body;

    const transactions = await base44.asServiceRole.entities.AssetTransaction.filter(
      { asset_id: assetId },
      'transaction_date'
    );

    let holdings = [];
    let results = [];

    for (const tx of transactions) {
      if (tx.transaction_type === 'BUY') {
        holdings.push({
          date: tx.transaction_date,
          qty: tx.quantity,
          price: tx.price_per_unit,
          txId: tx.id
        });
      } else if (tx.transaction_type === 'SELL') {
        let remainingQty = tx.quantity;
        let costBasis = 0;

        while (remainingQty > 0 && holdings.length > 0) {
          const holding = holdings[0];
          const qtyToSell = Math.min(remainingQty, holding.qty);

          costBasis += qtyToSell * holding.price;
          const proceedsEach = qtyToSell * tx.price_per_unit;
          const gainLoss = proceedsEach - (qtyToSell * holding.price);

          results.push({
            sellDate: tx.transaction_date,
            buyDate: holding.date,
            quantity: qtyToSell,
            buyPrice: holding.price,
            sellPrice: tx.price_per_unit,
            gainLoss: gainLoss,
            holdingPeriodDays: Math.floor(
              (new Date(tx.transaction_date) - new Date(holding.date)) / (1000 * 60 * 60 * 24)
            ),
            longTermGain: Math.floor((new Date(tx.transaction_date) - new Date(holding.date)) / (1000 * 60 * 60 * 24)) > 365
          });

          holding.qty -= qtyToSell;
          if (holding.qty === 0) {
            holdings.shift();
          }

          remainingQty -= qtyToSell;
        }
      }
    }

    return Response.json({
      fifoResults: results,
      totalLongTermGains: results.filter(r => r.longTermGain).reduce((sum, r) => sum + r.gainLoss, 0),
      totalShortTermGains: results.filter(r => !r.longTermGain).reduce((sum, r) => sum + r.gainLoss, 0)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});