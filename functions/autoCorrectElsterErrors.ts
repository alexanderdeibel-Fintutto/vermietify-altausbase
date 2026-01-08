import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log('[AUTO-CORRECT] Attempting to auto-correct errors in submission:', submission_id);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    if (!submission.validation_errors || submission.validation_errors.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'Keine Fehler zum Korrigieren vorhanden'
      });
    }

    // KI-gestützte Fehlerkorrektur
    const prompt = `
Du bist ein Experte für ELSTER-Formulare. Korrigiere diese Fehler automatisch.

FEHLER:
${JSON.stringify(submission.validation_errors, null, 2)}

FORMULARDATEN:
${JSON.stringify(submission.form_data, null, 2)}

Gebe für jeden Fehler einen Korrekturvorschlag zurück:
- Welches Feld ist falsch
- Was ist der korrigierte Wert
- Begründung

Antworte NUR mit JSON.
    `;

    const corrections = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          corrections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                original_value: { type: "string" },
                corrected_value: { type: "string" },
                reasoning: { type: "string" },
                auto_correctable: { type: "boolean" }
              }
            }
          },
          total_corrections: { type: "number" }
        }
      }
    });

    // Korrektionen anwenden
    const correctedFormData = { ...submission.form_data };
    const appliedCorrections = [];

    for (const correction of corrections.corrections || []) {
      if (correction.auto_correctable) {
        correctedFormData[correction.field] = correction.corrected_value;
        appliedCorrections.push({
          field: correction.field,
          old: correction.original_value,
          new: correction.corrected_value
        });
      }
    }

    // Submission aktualisieren
    if (appliedCorrections.length > 0) {
      await base44.entities.ElsterSubmission.update(submission_id, {
        form_data: correctedFormData,
        validation_errors: submission.validation_errors.filter(err => 
          !appliedCorrections.some(corr => corr.field === err.field)
        )
      });
    }

    return Response.json({ 
      success: true, 
      applied_corrections: appliedCorrections,
      remaining_errors: submission.validation_errors.length - appliedCorrections.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});