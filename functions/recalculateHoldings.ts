import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { portfolioAccountId, assetId } = body;

    if (!portfolioAccountId || !assetId) {
      return Response.json(
        { error: 'portfolioAccountId und assetId erforderlich' },
        { status: 400 }
      );
    }

    // Hole alle Transaktionen für dieses Asset im Konto
    const transactions = await base44.entities.AssetTransaction.filter({
      portfolio_account_id: portfolioAccountId,
      asset_id: assetId
    });

    // Sortiere nach Datum (FIFO)
    transactions.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    // Berechne Bestände
    let quantity = 0;
    let totalCost = 0;
    let firstPurchaseDate = null;
    let buyTransactions = [];

    transactions.forEach(tx => {
      if (tx.transaction_type === 'buy' || tx.transaction_type === 'transfer_in') {
        buyTransactions.push(tx);
        quantity += tx.quantity;
        totalCost += tx.gross_amount;
        if (!firstPurchaseDate) {
          firstPurchaseDate = tx.transaction_date;
        }
      } else if (tx.transaction_type === 'sell' || tx.transaction_type === 'transfer_out') {
        quantity -= Math.abs(tx.quantity);
      }
    });

    const averageCostBasis = quantity > 0 ? totalCost / quantity : 0;

    // Suche oder erstelle AssetHolding
    const existingHoldings = await base44.entities.AssetHolding.filter({
      portfolio_account_id: portfolioAccountId,
      asset_id: assetId
    });

    const holdingData = {
      quantity,
      average_cost_basis: averageCostBasis,
      total_cost_basis: totalCost,
      first_purchase_date: firstPurchaseDate
    };

    if (existingHoldings.length > 0) {
      // Aktualisiere existierende
      const holding = existingHoldings[0];
      await base44.entities.AssetHolding.update(holding.id, holdingData);
      return Response.json({
        success: true,
        message: 'AssetHolding aktualisiert',
        holding: { id: holding.id, ...holdingData }
      });
    } else if (quantity > 0) {
      // Erstelle neue (nur wenn quantity > 0)
      const newHolding = await base44.entities.AssetHolding.create({
        portfolio_account_id: portfolioAccountId,
        asset_id: assetId,
        ...holdingData
      });
      return Response.json({
        success: true,
        message: 'AssetHolding erstellt',
        holding: newHolding
      });
    }

    return Response.json({
      success: true,
      message: 'Bestände berechnet (kein Bestand vorhanden)',
      quantity: 0
    });
  } catch (error) {
    console.error('Recalculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});