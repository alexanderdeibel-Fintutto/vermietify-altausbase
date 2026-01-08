import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log(`[AUTO-CORRECT] Processing ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const errors = sub.validation_errors || [];

    if (errors.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'Keine Fehler zu korrigieren' 
      });
    }

    const corrections = [];
    const formData = { ...sub.form_data };

    // Automatische Korrekturen
    for (const error of errors) {
      const field = error.field;
      const errorType = error.type || error.code;

      // Fehlende Pflichtfelder
      if (errorType === 'required' && !formData[field]) {
        // Versuche Standardwerte
        if (field.includes('datum')) {
          formData[field] = new Date().toISOString().split('T')[0];
          corrections.push({ field, action: 'set_default_date' });
        } else if (field.includes('betrag') || field.includes('summe')) {
          formData[field] = 0;
          corrections.push({ field, action: 'set_zero' });
        }
      }

      // Ungültige Zahlenformate
      if (errorType === 'format' && typeof formData[field] === 'string') {
        const cleaned = formData[field].replace(/[^\d.-]/g, '');
        if (!isNaN(parseFloat(cleaned))) {
          formData[field] = parseFloat(cleaned);
          corrections.push({ field, action: 'format_number', old: formData[field], new: cleaned });
        }
      }

      // Falsche Datentypen
      if (errorType === 'type' && formData[field]) {
        if (error.expected === 'number' && typeof formData[field] === 'string') {
          formData[field] = parseFloat(formData[field]);
          corrections.push({ field, action: 'convert_to_number' });
        }
      }
    }

    if (corrections.length > 0) {
      await base44.entities.ElsterSubmission.update(submission_id, {
        form_data: formData
      });

      await base44.asServiceRole.entities.ActivityLog.create({
        entity_type: 'ElsterSubmission',
        entity_id: submission_id,
        action: 'auto_corrected',
        details: { corrections },
        performed_by: 'system'
      });
    }

    console.log(`[AUTO-CORRECT] Applied ${corrections.length} corrections`);

    return Response.json({
      success: true,
      corrections_applied: corrections.length,
      corrections
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});