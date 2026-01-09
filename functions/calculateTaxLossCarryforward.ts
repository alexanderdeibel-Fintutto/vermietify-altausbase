import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Berechnet Verlustvortrag aus verkauften Assets für Steuerjahr
 * Nutzt Gewinn/Verlust Berechnung und organisiert nach Kategorien
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year } = await req.json();

    if (!year || year < 2000 || year > 2100) {
      return Response.json(
        { error: 'Ungültiges Jahr' },
        { status: 400 }
      );
    }

    // Alle verkauften Assets des Nutzers laden
    const soldAssets = await base44.entities.AssetPortfolio.filter(
      {
        user_id: user.id,
        status: 'sold'
      },
      '',
      5000
    );

    let totalLoss = 0;
    const lossesByCategory = {};
    const relatedAssets = [];

    // Verluste berechnen (nur wenn Wert < Einstand)
    for (const asset of soldAssets) {
      const totalInvested = asset.quantity * asset.purchase_price;
      const totalValue = asset.quantity * asset.current_value;
      const loss = totalInvested - totalValue;

      if (loss > 0) {
        totalLoss += loss;
        relatedAssets.push(asset.id);

        // Nach Kategorie organisieren
        const category = asset.asset_category || 'other';
        lossesByCategory[category] = (lossesByCategory[category] || 0) + loss;

        // Activity Log
        await base44.entities.ActivityLog.create({
          user_id: user.id,
          action: 'loss_carryforward_calculated',
          entity_type: 'AssetPortfolio',
          entity_id: asset.id,
          details: {
            asset_name: asset.name,
            loss_amount: loss,
            invested: totalInvested,
            value: totalValue
          }
        });
      }
    }

    // TaxLossCarryforward speichern
    const existingCarryforward = await base44.entities.TaxLossCarryforward.filter(
      { user_id: user.id, year },
      '',
      1
    );

    let result;
    if (existingCarryforward.length > 0) {
      // Aktualisieren
      result = await base44.entities.TaxLossCarryforward.update(existingCarryforward[0].id, {
        loss_amount: totalLoss,
        losses_by_category: lossesByCategory,
        remaining_amount: totalLoss,
        related_asset_ids: relatedAssets,
        calculation_date: new Date().toISOString()
      });
    } else {
      // Neu erstellen
      result = await base44.entities.TaxLossCarryforward.create({
        user_id: user.id,
        year,
        loss_amount: totalLoss,
        losses_by_category: lossesByCategory,
        remaining_amount: totalLoss,
        related_asset_ids: relatedAssets,
        calculation_date: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      year,
      total_loss: totalLoss,
      losses_by_category: lossesByCategory,
      affected_assets: relatedAssets.length,
      carryforward_id: result.id
    });

  } catch (error) {
    console.error('Tax loss calculation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});