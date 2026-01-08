import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log('[ERROR-PREDICTION] Predicting potential errors for submission:', submission_id);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // Historische Fehler analysieren
    const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id: submission.building_id,
      tax_form_type: submission.tax_form_type
    });

    const commonErrors = {};
    for (const hist of historicalSubmissions) {
      if (hist.validation_errors && hist.validation_errors.length > 0) {
        for (const error of hist.validation_errors) {
          const key = error.field || error.type;
          commonErrors[key] = (commonErrors[key] || 0) + 1;
        }
      }
    }

    // KI-basierte Fehlervorhersage
    const prompt = `
Analysiere diese ELSTER-Formulardaten und prognostiziere wahrscheinliche Fehler basierend auf:
- Häufige Fehler in diesem Formulartyp: ${JSON.stringify(commonErrors)}
- Aktuelle Daten: ${JSON.stringify(submission.form_data)}
- Steuerjahr: ${submission.tax_year}
- Rechtsform: ${submission.legal_form}

Gib folgende Prognose ab:
1. Wahrscheinliche Fehler (mit Eintrittswahrscheinlichkeit %)
2. Risikobereiche
3. Empfohlene Kontrollen

Antworte NUR mit JSON.
    `;

    const prediction = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          risk_score: { type: "number" },
          predicted_errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                error_type: { type: "string" },
                probability: { type: "number" },
                mitigation: { type: "string" }
              }
            }
          },
          risk_areas: { type: "array", items: { type: "string" } },
          recommended_checks: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ 
      success: true, 
      risk_score: prediction.risk_score,
      predicted_errors: prediction.predicted_errors,
      risk_areas: prediction.risk_areas,
      recommended_checks: prediction.recommended_checks
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});