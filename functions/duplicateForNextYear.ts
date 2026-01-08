import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[DUPLICATE] Duplicating submission ${submission_id} for next year`);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const original = submissions[0];
    const nextYear = original.tax_year + 1;

    // Prüfe ob bereits existiert
    const existing = await base44.entities.ElsterSubmission.filter({
      building_id: original.building_id,
      tax_form_type: original.tax_form_type,
      tax_year: nextYear
    });

    if (existing.length > 0) {
      return Response.json({
        success: false,
        error: 'Submission for next year already exists',
        existing_id: existing[0].id
      });
    }

    // Nutze Smart Pre-Fill für intelligente Duplizierung
    const preFillResponse = await base44.functions.invoke('smartPreFillForm', {
      building_id: original.building_id,
      form_type: original.tax_form_type,
      tax_year: nextYear
    });

    const preFillData = preFillResponse.data.success ? preFillResponse.data.prefill_data : {};

    // Erstelle neue Submission
    const newSubmission = await base44.entities.ElsterSubmission.create({
      building_id: original.building_id,
      tax_form_type: original.tax_form_type,
      legal_form: original.legal_form,
      tax_year: nextYear,
      submission_mode: original.submission_mode,
      status: 'DRAFT',
      form_data: {
        ...original.form_data,
        ...preFillData,
        // Entferne dynamische Felder die neu berechnet werden sollten
        validation_date: undefined,
        submission_date: undefined
      },
      metadata: {
        duplicated_from: original.id,
        original_year: original.tax_year,
        duplication_date: new Date().toISOString(),
        prefill_confidence: preFillResponse.data.average_confidence
      }
    });

    // Log Audit Event
    await base44.functions.invoke('logElsterAuditEvent', {
      submission_id: newSubmission.id,
      event_type: 'CREATED_FROM_DUPLICATE',
      details: `Dupliziert von Jahr ${original.tax_year} (ID: ${original.id})`,
      metadata: {
        original_id: original.id,
        prefill_confidence: preFillResponse.data.average_confidence
      }
    });

    console.log(`[SUCCESS] Created submission ${newSubmission.id} for year ${nextYear}`);

    return Response.json({
      success: true,
      new_submission_id: newSubmission.id,
      tax_year: nextYear,
      prefill_confidence: preFillResponse.data.average_confidence,
      suggestions_count: preFillResponse.data.suggestions?.length || 0
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});