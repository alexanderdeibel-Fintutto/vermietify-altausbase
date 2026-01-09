import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Rollback eines fehlgeschlagenen oder versehentlich durchgeführten Imports
 * Löscht alle Assets der Batch und markiert als rolled_back
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batch_id } = await req.json();

    if (!batch_id) {
      return Response.json(
        { error: 'batch_id erforderlich' },
        { status: 400 }
      );
    }

    // ImportBatchLog finden
    const batchLog = await base44.entities.ImportBatchLog.filter(
      { user_id: user.id, batch_id },
      '',
      1
    );

    if (batchLog.length === 0) {
      return Response.json(
        { error: 'Import-Batch nicht gefunden' },
        { status: 404 }
      );
    }

    const batch = batchLog[0];

    if (batch.status === 'rolled_back') {
      return Response.json(
        { error: 'Batch wurde bereits zurückgerollt' },
        { status: 400 }
      );
    }

    // Assets der Batch laden
    const assetsToDelete = await base44.entities.AssetPortfolio.filter(
      {
        user_id: user.id,
        import_batch_id: batch_id
      },
      '',
      10000
    );

    let deletedCount = 0;
    const errors = [];

    // Alle Assets auf "transferred" setzen (soft delete)
    for (const asset of assetsToDelete) {
      try {
        await base44.entities.AssetPortfolio.update(asset.id, {
          status: 'transferred',
          notes: `[Rolled back from batch ${batch_id} on ${new Date().toISOString()}]`
        });
        deletedCount++;
      } catch (error) {
        errors.push({
          asset_id: asset.id,
          error: error.message
        });
      }
    }

    // ImportBatchLog aktualisieren
    const rollbackDate = new Date().toISOString();
    await base44.entities.ImportBatchLog.update(batch.id, {
      status: 'rolled_back',
      rollback_date: rollbackDate
    });

    // Activity Log
    await base44.entities.ActivityLog.create({
      user_id: user.id,
      action: 'csv_import_rolled_back',
      entity_type: 'ImportBatch',
      entity_id: batch.id,
      details: {
        batch_id,
        deleted_count: deletedCount,
        original_import_date: batch.import_date,
        rollback_date: rollbackDate,
        error_count: errors.length
      },
      status: errors.length === 0 ? 'success' : 'partial_success'
    });

    return Response.json({
      success: true,
      batch_id,
      deleted_count: deletedCount,
      total_in_batch: assetsToDelete.length,
      errors: errors.length > 0 ? errors : null,
      message: `${deletedCount} von ${assetsToDelete.length} Assets zurückgerollt`
    });

  } catch (error) {
    console.error('Rollback error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});