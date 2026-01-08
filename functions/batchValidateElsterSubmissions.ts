import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids)) {
      return Response.json({ error: 'submission_ids array required' }, { status: 400 });
    }

    console.log(`[BATCH-VALIDATE] Processing ${submission_ids.length} submissions`);

    const results = [];

    for (const id of submission_ids) {
      try {
        const submission = await base44.entities.ElsterSubmission.filter({ id });
        if (!submission || submission.length === 0) {
          results.push({ id, success: false, error: 'Not found' });
          continue;
        }

        const sub = submission[0];
        const validation_result = {
          errors: [],
          warnings: [],
          infos: []
        };

        // Validierungen
        if (!sub.form_data?.income_rent || sub.form_data.income_rent <= 0) {
          validation_result.errors.push({
            field: 'income_rent',
            message: 'Mieteinnahmen müssen größer als 0 sein'
          });
        }

        if (sub.form_data?.expense_property_tax > 5000) {
          validation_result.warnings.push({
            field: 'expense_property_tax',
            message: 'Grundsteuer erscheint ungewöhnlich hoch'
          });
        }

        const total_expenses = (sub.form_data?.expense_property_tax || 0) +
                               (sub.form_data?.expense_insurance || 0) +
                               (sub.form_data?.expense_maintenance || 0);

        if (total_expenses > (sub.form_data?.income_rent || 0)) {
          validation_result.warnings.push({
            field: 'expenses',
            message: 'Ausgaben übersteigen Einnahmen (Verlust)'
          });
        }

        const new_status = validation_result.errors.length === 0 ? 'VALIDATED' : 'DRAFT';
        const confidence = validation_result.errors.length === 0 ? 95 : 50;

        await base44.entities.ElsterSubmission.update(id, {
          status: new_status,
          validation_errors: validation_result.errors,
          validation_warnings: validation_result.warnings,
          ai_confidence_score: confidence
        });

        results.push({
          id,
          success: true,
          status: new_status,
          errors: validation_result.errors.length,
          warnings: validation_result.warnings.length
        });

        console.log(`[SUCCESS] Validated ${id}: ${new_status}`);
      } catch (error) {
        results.push({ id, success: false, error: error.message });
        console.error(`[ERROR] Failed to validate ${id}:`, error);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return Response.json({
      success: true,
      total: submission_ids.length,
      successful,
      failed,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});