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

    // Alle Transaktionen für dieses Asset
    const transactions = await base44.entities.AssetTransaction.filter({
      portfolio_account_id: portfolioAccountId,
      asset_id: assetId
    });

    // Nach Datum sortieren (FIFO)
    transactions.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    // Berechnung
    let quantity = 0;
    let totalCost = 0;
    let firstPurchaseDate = null;
    const taxLots = []; // FIFO-Tracking für Steuer

    for (const tx of transactions) {
      if (['buy', 'transfer_in'].includes(tx.transaction_type)) {
        quantity += tx.quantity;
        totalCost += tx.net_amount;
        
        if (!firstPurchaseDate) {
          firstPurchaseDate = tx.transaction_date;
        }

        // Tax Lot hinzufügen
        taxLots.push({
          date: tx.transaction_date,
          quantity: tx.quantity,
          costBasis: tx.net_amount,
          pricePerUnit: tx.price_per_unit
        });
      } else if (['sell', 'transfer_out'].includes(tx.transaction_type)) {
        const soldQuantity = Math.abs(tx.quantity);
        let remainingToSell = soldQuantity;

        // FIFO: Verkaufe aus den ältesten Lots
        while (remainingToSell > 0 && taxLots.length > 0) {
          const lot = taxLots[0];
          
          if (lot.quantity <= remainingToSell) {
            remainingToSell -= lot.quantity;
            totalCost -= lot.costBasis;
            quantity -= lot.quantity;
            taxLots.shift();
          } else {
            const ratio = remainingToSell / lot.quantity;
            totalCost -= lot.costBasis * ratio;
            quantity -= remainingToSell;
            lot.quantity -= remainingToSell;
            lot.costBasis -= lot.costBasis * ratio;
            remainingToSell = 0;
          }
        }
      }
    }

    const averageCostBasis = quantity > 0 ? totalCost / quantity : 0;

    // Holdings aktualisieren
    const existingHoldings = await base44.entities.AssetHolding.filter({
      portfolio_account_id: portfolioAccountId,
      asset_id: assetId
    });

    const holdingData = {
      quantity: Math.max(0, quantity),
      average_cost_basis: averageCostBasis,
      total_cost_basis: totalCost,
      first_purchase_date: firstPurchaseDate
    };

    // Aktueller Kurs laden
    const latestPrices = await base44.entities.AssetPrice.filter(
      { asset_id: assetId },
      '-price_date',
      1
    );

    if (latestPrices.length > 0) {
      const currentPrice = latestPrices[0].close_price;
      const currentValue = holdingData.quantity * currentPrice;
      const unrealizedGL = currentValue - holdingData.total_cost_basis;

      holdingData.current_price = currentPrice;
      holdingData.current_value = currentValue;
      holdingData.unrealized_gain_loss = unrealizedGL;
      holdingData.unrealized_gain_loss_percent = 
        holdingData.total_cost_basis > 0 
          ? (unrealizedGL / holdingData.total_cost_basis) * 100 
          : 0;
      holdingData.last_price_update = new Date().toISOString();
    }

    if (existingHoldings.length > 0) {
      const holding = existingHoldings[0];
      
      if (holdingData.quantity <= 0) {
        // Position vollständig verkauft - löschen
        await base44.entities.AssetHolding.delete(holding.id);
        return Response.json({
          success: true,
          message: 'Position vollständig verkauft',
          quantity: 0
        });
      }

      await base44.entities.AssetHolding.update(holding.id, holdingData);
      return Response.json({
        success: true,
        message: 'Bestand aktualisiert',
        holding: { id: holding.id, ...holdingData }
      });
    } else if (holdingData.quantity > 0) {
      const newHolding = await base44.entities.AssetHolding.create({
        portfolio_account_id: portfolioAccountId,
        asset_id: assetId,
        ...holdingData
      });
      return Response.json({
        success: true,
        message: 'Bestand erstellt',
        holding: newHolding
      });
    }

    return Response.json({
      success: true,
      message: 'Keine Bestände vorhanden',
      quantity: 0
    });
  } catch (error) {
    console.error('Recalculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});