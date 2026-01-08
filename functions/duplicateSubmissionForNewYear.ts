import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { source_submission_id, target_year } = await req.json();

    if (!source_submission_id || !target_year) {
      return Response.json({ error: 'source_submission_id and target_year required' }, { status: 400 });
    }

    console.log(`[DUPLICATE] Copying submission ${source_submission_id} to year ${target_year}`);

    const source = await base44.entities.ElsterSubmission.filter({ id: source_submission_id });
    if (!source || source.length === 0) {
      return Response.json({ error: 'Source submission not found' }, { status: 404 });
    }

    const sourceSub = source[0];

    // Prüfe ob für dieses Jahr bereits eine Submission existiert
    const existing = await base44.entities.ElsterSubmission.filter({
      building_id: sourceSub.building_id,
      tax_form_type: sourceSub.tax_form_type,
      tax_year: target_year
    });

    if (existing && existing.length > 0) {
      return Response.json({ 
        error: `Für das Jahr ${target_year} existiert bereits eine Submission` 
      }, { status: 409 });
    }

    // Erstelle neue Submission mit kopierten Daten
    const newSubmission = await base44.entities.ElsterSubmission.create({
      building_id: sourceSub.building_id,
      tax_form_type: sourceSub.tax_form_type,
      legal_form: sourceSub.legal_form,
      tax_year: target_year,
      submission_mode: sourceSub.submission_mode,
      form_data: { ...sourceSub.form_data }, // Kopiere Formulardaten
      status: 'DRAFT',
      ai_confidence_score: 0,
      validation_errors: [],
      validation_warnings: []
    });

    console.log(`[SUCCESS] Created new submission ${newSubmission.id}`);

    return Response.json({
      success: true,
      new_submission_id: newSubmission.id,
      source_year: sourceSub.tax_year,
      target_year,
      message: `Formular erfolgreich für ${target_year} dupliziert`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});