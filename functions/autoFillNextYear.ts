import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, form_type, source_year } = await req.json();

    if (!building_id || !form_type || !source_year) {
      return Response.json({ 
        error: 'building_id, form_type and source_year required' 
      }, { status: 400 });
    }

    const targetYear = source_year + 1;

    console.log(`[AUTO-FILL] Filling ${form_type} for ${targetYear} based on ${source_year}`);

    // Hole Source-Submission
    const sourceSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id,
      tax_form_type: form_type,
      tax_year: source_year,
      status: { $in: ['ACCEPTED', 'SUBMITTED'] }
    });

    if (sourceSubmissions.length === 0) {
      return Response.json({ 
        error: `No accepted submission found for ${source_year}` 
      }, { status: 404 });
    }

    const source = sourceSubmissions[0];

    // Prüfe ob Target bereits existiert
    const existing = await base44.entities.ElsterSubmission.filter({
      building_id,
      tax_form_type: form_type,
      tax_year: targetYear
    });

    if (existing.length > 0) {
      return Response.json({ 
        error: `Submission for ${targetYear} already exists` 
      }, { status: 400 });
    }

    // Erstelle neue Submission mit vorausgefüllten Daten
    const newFormData = { ...source.form_data };
    
    // Aktualisiere Jahres-spezifische Felder
    if (newFormData.steuerjahr) {
      newFormData.steuerjahr = targetYear;
    }

    // Nullsetze transaktionale Daten (müssen neu eingegeben werden)
    const transactionalFields = [
      'einnahmen_gesamt',
      'ausgaben_gesamt',
      'ueberschuss',
      'mieteinnahmen',
      'nebenkosten'
    ];

    transactionalFields.forEach(field => {
      if (field in newFormData) {
        delete newFormData[field];
      }
    });

    const newSubmission = await base44.entities.ElsterSubmission.create({
      building_id,
      tax_form_type: form_type,
      legal_form: source.legal_form,
      tax_year: targetYear,
      submission_mode: source.submission_mode,
      form_data: newFormData,
      status: 'DRAFT'
    });

    // Log
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: newSubmission.id,
      action: 'auto_filled',
      user_id: user.id,
      metadata: {
        source_submission_id: source.id,
        source_year: source_year,
        target_year: targetYear
      }
    });

    console.log(`[AUTO-FILL] Created submission ${newSubmission.id} for ${targetYear}`);

    return Response.json({
      success: true,
      submission: newSubmission
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});