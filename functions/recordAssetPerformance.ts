import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Speichert Kursdaten für Asset-Performance-Tracking
 * Wird regelmäßig aufgerufen oder manuell für Historien-Aufbau
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asset_id, value_per_unit, notes } = await req.json();

    if (!asset_id || value_per_unit === undefined) {
      return Response.json(
        { error: 'asset_id und value_per_unit erforderlich' },
        { status: 400 }
      );
    }

    // Asset laden
    const asset = await base44.entities.AssetPortfolio.filter(
      { id: asset_id, user_id: user.id },
      '',
      1
    );

    if (asset.length === 0) {
      return Response.json(
        { error: 'Asset nicht gefunden' },
        { status: 404 }
      );
    }

    const assetRecord = asset[0];
    const totalValue = assetRecord.quantity * value_per_unit;

    // Letzte Performance-Messung laden für Change-Berechnung
    const lastPerformance = await base44.entities.AssetPerformanceHistory.filter(
      { asset_id, user_id: user.id },
      '-created_date',
      1
    );

    let changePercent = 0;
    if (lastPerformance.length > 0) {
      const lastValue = lastPerformance[0].value_per_unit;
      changePercent = ((value_per_unit - lastValue) / lastValue) * 100;
    }

    // Performance-Datensatz erstellen
    const performance = await base44.entities.AssetPerformanceHistory.create({
      asset_id,
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      value_per_unit: parseFloat(value_per_unit),
      total_value: totalValue,
      change_percent: changePercent,
      source: 'manual',
      notes: notes || null
    });

    // Asset aktualisieren
    await base44.entities.AssetPortfolio.update(asset_id, {
      current_value: parseFloat(value_per_unit),
      last_updated: new Date().toISOString()
    });

    // Activity Log
    await base44.entities.ActivityLog.create({
      user_id: user.id,
      action: 'asset_updated',
      entity_type: 'AssetPortfolio',
      entity_id: asset_id,
      details: {
        asset_name: assetRecord.name,
        old_value: assetRecord.current_value,
        new_value: value_per_unit,
        change_percent: changePercent
      }
    });

    return Response.json({
      success: true,
      performance_id: performance.id,
      change_percent: changePercent.toFixed(2)
    });

  } catch (error) {
    console.error('Performance recording error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});