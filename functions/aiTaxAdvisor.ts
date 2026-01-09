import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, context = {} } = await req.json();
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];

    // AI Tax Advisor für Fragen
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein erfahrener internationaler Steuerberater für ${profile.primary_residence_country}.

USER PROFIL:
- Komplexität: ${profile.profile_type}
- Länder: ${profile.tax_jurisdictions.join(', ')}
- Einkommensquellen: ${profile.income_sources?.map(s => s.type).join(', ') || 'nicht angegeben'}
- Assets: ${profile.asset_categories?.join(', ') || 'nicht angegeben'}

USER FRAGE:
${question}

ZUSÄTZLICHER KONTEXT:
${JSON.stringify(context, null, 2)}

ANTWORTE:
- Kurz und prägnant
- Auf die Länder des Users fokussiert
- Praktische Handlungsempfehlungen
- Warnung vor Risiken wenn relevant
- Links zu Formularen wenn nötig`,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          key_points: { type: "array", items: { type: "string" } },
          action_items: { type: "array", items: { type: "string" } },
          relevant_forms: { type: "array", items: { type: "string" } },
          risk_warning: { type: "string" },
          follow_up_questions: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      question,
      advisor_response: response
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});