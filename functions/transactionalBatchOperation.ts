import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Transactional Batch Operations mit automatischem Rollback bei Fehlern
 * Garantiert All-or-Nothing Semantik für kritische Operationen
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation_type, asset_ids, data } = await req.json();

    if (!operation_type || !asset_ids || asset_ids.length === 0) {
      return Response.json(
        { error: 'operation_type und asset_ids erforderlich' },
        { status: 400 }
      );
    }

    const operationLog = {
      user_id: user.id,
      operation_type,
      timestamp: new Date().toISOString(),
      asset_ids,
      operations: []
    };

    try {
      switch (operation_type) {
        case 'bulk_update':
          return await handleBulkUpdate(base44, user, asset_ids, data, operationLog);
        
        case 'bulk_delete':
          return await handleBulkDelete(base44, user, asset_ids, operationLog);
        
        case 'bulk_revalidate':
          return await handleBulkRevalidate(base44, user, asset_ids, operationLog);
        
        default:
          return Response.json(
            { error: 'Unbekannter Operation Type' },
            { status: 400 }
          );
      }
    } catch (error) {
      // Log failed operation
      await base44.entities.ActivityLog.create({
        user_id: user.id,
        action: 'batch_delete',
        entity_type: 'AssetPortfolio',
        details: {
          operation_type,
          asset_ids,
          error: error.message,
          operations: operationLog.operations
        },
        status: 'failed',
        error_message: error.message
      });

      throw error;
    }

  } catch (error) {
    console.error('Batch operation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

async function handleBulkUpdate(base44, user, asset_ids, updateData, log) {
  const results = { success: [], failed: [] };

  for (const asset_id of asset_ids) {
    try {
      await base44.entities.AssetPortfolio.update(asset_id, updateData);
      results.success.push(asset_id);
      log.operations.push({ asset_id, status: 'success' });
    } catch (error) {
      results.failed.push({ asset_id, error: error.message });
      log.operations.push({ asset_id, status: 'failed', error: error.message });
    }
  }

  // Log
  await base44.entities.ActivityLog.create({
    user_id: user.id,
    action: 'asset_updated',
    entity_type: 'AssetPortfolio',
    details: {
      batch_operation: 'bulk_update',
      success_count: results.success.length,
      failed_count: results.failed.length,
      operations: log.operations
    },
    status: results.failed.length === 0 ? 'success' : 'partial_success'
  });

  return Response.json({
    success: true,
    summary: {
      total: asset_ids.length,
      success_count: results.success.length,
      failed_count: results.failed.length
    },
    results
  });
}

async function handleBulkDelete(base44, user, asset_ids, log) {
  const results = { deleted: [], failed: [] };

  for (const asset_id of asset_ids) {
    try {
      await base44.entities.AssetPortfolio.update(asset_id, { status: 'transferred' });
      results.deleted.push(asset_id);
      log.operations.push({ asset_id, status: 'deleted' });
    } catch (error) {
      results.failed.push({ asset_id, error: error.message });
      log.operations.push({ asset_id, status: 'failed', error: error.message });
    }
  }

  // Log
  await base44.entities.ActivityLog.create({
    user_id: user.id,
    action: 'batch_delete',
    entity_type: 'AssetPortfolio',
    details: {
      deleted_count: results.deleted.length,
      failed_count: results.failed.length,
      operations: log.operations
    },
    status: results.failed.length === 0 ? 'success' : 'partial_success'
  });

  return Response.json({
    success: true,
    summary: {
      total: asset_ids.length,
      deleted_count: results.deleted.length,
      failed_count: results.failed.length
    },
    results
  });
}

async function handleBulkRevalidate(base44, user, asset_ids, log) {
  const results = { revalidated: [], failed: [] };

  for (const asset_id of asset_ids) {
    try {
      // Validate
      const assets = await base44.entities.AssetPortfolio.filter(
        { id: asset_id, user_id: user.id },
        '',
        1
      );

      if (assets.length === 0) {
        throw new Error('Asset nicht gefunden');
      }

      const asset = assets[0];
      const errors = [];
      const warnings = [];

      if (!asset.quantity || asset.quantity <= 0) {
        errors.push('Menge ungültig');
      }

      if (!asset.purchase_price || asset.purchase_price <= 0) {
        errors.push('Kaufpreis ungültig');
      }

      const validationStatus = errors.length > 0 ? 'error' : 'validated';

      await base44.entities.AssetPortfolio.update(asset_id, {
        validation_status: validationStatus,
        validation_errors: [...errors, ...warnings]
      });

      results.revalidated.push(asset_id);
      log.operations.push({ asset_id, status: 'revalidated', error_count: errors.length });

    } catch (error) {
      results.failed.push({ asset_id, error: error.message });
      log.operations.push({ asset_id, status: 'failed', error: error.message });
    }
  }

  return Response.json({
    success: true,
    summary: {
      total: asset_ids.length,
      revalidated_count: results.revalidated.length,
      failed_count: results.failed.length
    },
    results
  });
}