import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, target_year } = await req.json();

    const subs = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (subs.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const source = subs[0];

    // Prüfe ob bereits Submission für das Zieljahr existiert
    const existing = await base44.entities.ElsterSubmission.filter({
      building_id: source.building_id,
      tax_form_type: source.tax_form_type,
      tax_year: target_year
    });

    if (existing.length > 0) {
      return Response.json({ error: 'Submission für dieses Jahr existiert bereits' }, { status: 400 });
    }

    // Intelligente Datenübernahme
    const migratedData = { ...source.form_data };

    // Aktualisiere Jahresbezogene Felder
    if (migratedData.zeitraum_von) {
      migratedData.zeitraum_von = `01.01.${target_year}`;
    }
    if (migratedData.zeitraum_bis) {
      migratedData.zeitraum_bis = `31.12.${target_year}`;
    }

    // Reset berechnete Felder
    delete migratedData.einnahmen_gesamt;
    delete migratedData.werbungskosten_gesamt;

    const newSubmission = await base44.entities.ElsterSubmission.create({
      building_id: source.building_id,
      tax_form_type: source.tax_form_type,
      legal_form: source.legal_form,
      tax_year: target_year,
      submission_mode: source.submission_mode,
      form_data: migratedData,
      status: 'DRAFT'
    });

    return Response.json({ success: true, new_submission: newSubmission });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});