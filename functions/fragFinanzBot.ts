import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINANZ_FAQ_PROMPT = `Du bist ein hilfreicher Finanz-Assistent für deutsche Vermieter und Immobilieneigentümer.

DEINE AUFGABE:
Beantworte Fragen zu Finanzen, Steuern, Mietrecht und Buchhaltung in einfacher Sprache.

DEIN VERHALTEN:
1. Antworte kurz und präzise
2. Erkläre Fachbegriffe
3. Gib praktische Beispiele
4. Verweise bei komplexen Fällen auf Fachleute
5. Bleib beim Thema Immobilien/Finanzen

THEMENGEBIETE:
- Mietrecht (BGB, BetrKV)
- Steuern für Vermieter (Anlage V, AfA, Werbungskosten)
- Nebenkostenabrechnung
- Buchhaltung/SKR03
- Finanzierung
- Versicherungen

WICHTIG:
- Sei hilfreich aber vorsichtig bei rechtlichen/steuerlichen Fragen
- Weise auf Grenzen deiner Beratung hin wenn nötig
- Nutze € für Beträge
- Erkläre deutsche Besonderheiten`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages = [], conversationHistory = [] } = await req.json();

    const fullHistory = [
      ...conversationHistory,
      ...messages
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: FINANZ_FAQ_PROMPT,
        messages: fullHistory
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      return Response.json({ error: result.error?.message || "API error" }, { status: 400 });
    }

    const antwort = result.content[0]?.text || "";

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "finanz_faq_bot",
      model: "claude-3-5-sonnet-20241022",
      tokens_used: result.usage.output_tokens + result.usage.input_tokens,
      cost_eur: ((result.usage.input_tokens * 0.003 + result.usage.output_tokens * 0.015) / 1000).toFixed(4)
    });

    return Response.json({
      antwort,
      updatedHistory: [
        ...fullHistory,
        { role: "assistant", content: antwort }
      ],
      _meta: {
        model: "claude-3-5-sonnet-20241022",
        tokens: result.usage.output_tokens + result.usage.input_tokens,
        costEur: ((result.usage.input_tokens * 0.003 + result.usage.output_tokens * 0.015) / 1000).toFixed(4)
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});