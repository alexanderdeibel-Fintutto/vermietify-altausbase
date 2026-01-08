import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log('[XML-GENERATION] Generating ELSTER XML for submission:', submission_id);

    // Submission laden
    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // Template laden
    const templates = await base44.entities.ElsterFormTemplate.filter({
      form_type: submission.tax_form_type,
      legal_form: submission.legal_form,
      year: submission.tax_year
    });

    if (!templates || templates.length === 0) {
      return Response.json({ 
        error: 'No template found for this form/legal form/year combination' 
      }, { status: 404 });
    }

    const template = templates[0];

    // XML generieren durch Platzhalter-Ersetzung
    let xmlData = template.xml_template;

    // Grunddaten ersetzen
    xmlData = xmlData.replace(/\{\{steuernummer\}\}/g, submission.form_data?.steuernummer || '');
    xmlData = xmlData.replace(/\{\{tax_year\}\}/g, submission.tax_year.toString());

    // Formular-spezifische Felder ersetzen
    for (const [placeholder, value] of Object.entries(submission.form_data || {})) {
      const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
      xmlData = xmlData.replace(regex, value.toString());
    }

    // Verbleibende Platzhalter durch 0 ersetzen
    xmlData = xmlData.replace(/\{\{[^}]+\}\}/g, '0');

    // XML-Validierung (basic)
    if (!xmlData.includes('<?xml')) {
      return Response.json({ error: 'Invalid XML structure' }, { status: 400 });
    }

    // Submission mit XML aktualisieren
    await base44.entities.ElsterSubmission.update(submission_id, {
      xml_data: xmlData,
      status: 'VALIDATED'
    });

    return Response.json({ 
      success: true, 
      xml_data: xmlData,
      message: 'XML erfolgreich generiert'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});