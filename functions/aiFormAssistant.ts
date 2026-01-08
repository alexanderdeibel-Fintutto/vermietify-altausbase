import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, question, context } = await req.json();

    console.log(`[AI-ASSISTANT] Question: ${question}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    const prompt = `
Du bist ein ELSTER-Steuerexperte. Beantworte folgende Frage:

Frage: ${question}

Kontext:
- Formulartyp: ${sub.tax_form_type}
- Steuerjahr: ${sub.tax_year}
- Rechtsform: ${sub.legal_form}
- Formulardaten: ${JSON.stringify(sub.form_data, null, 2)}
${context ? `\nZusätzlicher Kontext: ${context}` : ''}

Gib eine präzise, praxisnahe Antwort auf Deutsch.
`;

    const answer = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          confidence: { type: 'number' },
          related_fields: { type: 'array', items: { type: 'string' } },
          action_needed: { type: 'boolean' }
        }
      }
    });

    console.log(`[AI-ASSISTANT] Answered with ${answer.confidence}% confidence`);

    return Response.json({
      success: true,
      ...answer
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});