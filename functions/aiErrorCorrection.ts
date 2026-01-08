import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    const subs = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (subs.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const sub = subs[0];
    const errors = sub.validation_errors || [];
    const warnings = sub.validation_warnings || [];

    if (errors.length === 0 && warnings.length === 0) {
      return Response.json({ success: true, message: 'Keine Fehler gefunden' });
    }

    console.log(`[AI-CORRECT] Analyzing ${errors.length} errors, ${warnings.length} warnings`);

    const corrections = [];

    // Analysiere mit LLM
    const prompt = `
Du bist ein ELSTER-Experte. Analysiere diese Fehler und schlage Korrekturen vor:

Formulardaten:
${JSON.stringify(sub.form_data, null, 2)}

Fehler:
${errors.map(e => e.message || JSON.stringify(e)).join('\n')}

Warnungen:
${warnings.map(w => w.message || JSON.stringify(w)).join('\n')}

Gib konkrete Korrekturvorschläge als JSON array zurück:
[{"field": "feldname", "current_value": "aktuell", "suggested_value": "vorschlag", "reason": "begründung"}]
`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          corrections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                current_value: { type: 'string' },
                suggested_value: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({ 
      success: true, 
      corrections: llmResponse.corrections || [],
      errors_analyzed: errors.length,
      warnings_analyzed: warnings.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});