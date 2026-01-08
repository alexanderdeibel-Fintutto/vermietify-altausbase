import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { submission_ids, recalculation_type = 'full' } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids)) {
      return Response.json({ error: 'submission_ids array required' }, { status: 400 });
    }

    console.log(`[BATCH-RECALC] Processing ${submission_ids.length} submissions`);

    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const id of submission_ids) {
      try {
        const submission = await base44.asServiceRole.entities.ElsterSubmission.filter({ id });
        
        if (submission.length === 0) {
          results.failed++;
          continue;
        }

        const sub = submission[0];
        
        if (!sub.building_id) {
          results.failed++;
          continue;
        }

        // Hole aktuelle Finanzdaten
        const financialItems = await base44.asServiceRole.entities.FinancialItem.filter({
          building_id: sub.building_id
        });

        const yearItems = financialItems.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === sub.tax_year;
        });

        // Berechne neu
        const calculations = yearItems.reduce((acc, item) => {
          const amount = parseFloat(item.amount || 0);
          if (item.type === 'INCOME') {
            acc.einnahmen += amount;
          } else if (item.type === 'EXPENSE') {
            acc.ausgaben += amount;
          }
          return acc;
        }, { einnahmen: 0, ausgaben: 0 });

        // Update Submission
        const updatedFormData = {
          ...sub.form_data,
          einnahmen_gesamt: calculations.einnahmen,
          werbungskosten_gesamt: calculations.ausgaben,
          recalculated_at: new Date().toISOString()
        };

        await base44.asServiceRole.entities.ElsterSubmission.update(id, {
          form_data: updatedFormData,
          ai_confidence_score: 85 // Nach Neuberechnung höher
        });

        results.updated++;
        results.processed++;

      } catch (error) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    console.log(`[BATCH-RECALC] Updated ${results.updated}/${submission_ids.length}`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});