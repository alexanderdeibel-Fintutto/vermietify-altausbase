import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, sync_direction = 'import' } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[ACCOUNTING-SYNC] ${sync_direction} for ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    if (sync_direction === 'import') {
      // Import financial data from FinancialItems
      if (!sub.building_id) {
        return Response.json({ error: 'No building_id to sync from' }, { status: 400 });
      }

      const financialItems = await base44.entities.FinancialItem.filter({
        building_id: sub.building_id
      });

      const relevantItems = financialItems.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === sub.tax_year;
      });

      const aggregated = relevantItems.reduce((acc, item) => {
        const amount = parseFloat(item.amount || 0);
        if (item.type === 'INCOME') {
          acc.total_income += amount;
        } else if (item.type === 'EXPENSE') {
          acc.total_expenses += amount;
          
          // Kategorisierung
          const category = item.category || 'sonstiges';
          acc.expenses_by_category[category] = (acc.expenses_by_category[category] || 0) + amount;
        }
        return acc;
      }, { 
        total_income: 0, 
        total_expenses: 0, 
        expenses_by_category: {} 
      });

      // Update Submission
      await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
        form_data: {
          ...sub.form_data,
          einnahmen_gesamt: aggregated.total_income,
          ausgaben_gesamt: aggregated.total_expenses,
          ausgaben_detail: aggregated.expenses_by_category,
          last_sync: new Date().toISOString(),
          synced_items_count: relevantItems.length
        }
      });

      console.log(`[ACCOUNTING-SYNC] Imported ${relevantItems.length} items`);

      return Response.json({
        success: true,
        imported: relevantItems.length,
        aggregated
      });

    } else if (sync_direction === 'export') {
      // Export submission data zurück ins Accounting
      const formData = sub.form_data || {};

      // Hier könnte man GeneratedFinancialBooking Entities erstellen
      console.log('[ACCOUNTING-SYNC] Export not yet implemented');

      return Response.json({
        success: true,
        message: 'Export functionality coming soon'
      });
    }

    return Response.json({ error: 'Invalid sync_direction' }, { status: 400 });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});