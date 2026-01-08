import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[SYNC] Starting financial data synchronization to ELSTER');

    const syncResult = {
      synced_items: 0,
      skipped_items: 0,
      errors: [],
      categories_mapped: {}
    };

    // Hole alle DRAFT/AI_PROCESSED Submissions
    const submissions = await base44.entities.ElsterSubmission.filter({
      status: { $in: ['DRAFT', 'AI_PROCESSED'] }
    });

    for (const submission of submissions) {
      try {
        if (!submission.building_id) {
          syncResult.skipped_items++;
          continue;
        }

        // Hole Finanzdaten für das Gebäude und Jahr
        const financialItems = await base44.asServiceRole.entities.FinancialItem.filter({
          building_id: submission.building_id,
          year: submission.tax_year
        });

        if (financialItems.length === 0) {
          syncResult.skipped_items++;
          continue;
        }

        // Aggregiere nach Kategorien
        const einnahmen = financialItems
          .filter(item => item.category === 'Einnahme')
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        const ausgaben = financialItems
          .filter(item => item.category === 'Ausgabe')
          .reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);

        // Update Submission mit synced data
        const updatedFormData = {
          ...submission.form_data,
          einnahmen_gesamt: Math.round(einnahmen * 100) / 100,
          ausgaben_gesamt: Math.round(ausgaben * 100) / 100,
          ueberschuss: Math.round((einnahmen - ausgaben) * 100) / 100,
          _synced_at: new Date().toISOString()
        };

        await base44.asServiceRole.entities.ElsterSubmission.update(submission.id, {
          form_data: updatedFormData
        });

        syncResult.synced_items++;

      } catch (error) {
        console.error(`[ERROR] Sync failed for ${submission.id}:`, error);
        syncResult.errors.push({
          submission_id: submission.id,
          error: error.message
        });
      }
    }

    // Log Sync
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: 'batch',
      action: 'financial_data_synced',
      user_id: user.id,
      changes: syncResult,
      metadata: {
        items_synced: syncResult.synced_items,
        sync_timestamp: new Date().toISOString()
      }
    });

    console.log(`[SYNC] Complete: ${syncResult.synced_items} synced, ${syncResult.skipped_items} skipped`);

    return Response.json({
      success: true,
      sync_result: syncResult
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});