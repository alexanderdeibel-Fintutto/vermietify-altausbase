import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STEUER_OPTIMIERER_PROMPT = `Du bist ein Steuerberater, der legale Steuerspar-Möglichkeiten für Vermieter aufzeigt.

WICHTIG: Du gibst allgemeine Hinweise, keine individuelle Steuerberatung.
Empfehle bei komplexen Fällen immer einen Steuerberater.

FOKUS auf Immobilien/Vermietung:
- Anlage V Optimierung
- Werbungskosten maximieren
- AfA richtig nutzen
- Erhaltungsaufwand vs. Herstellungskosten
- Finanzierungskosten

ANTWORTE IM JSON-FORMAT:
{
  "situation": {
    "immobilien_anzahl": 0,
    "vermietungsart": "privat|gewerblich"
  },
  "aktuelle_abzuege": [
    {
      "kategorie": "AfA|Zinsen|Erhaltung|...",
      "betrag": 0,
      "voll_ausgeschoepft": true|false
    }
  ],
  "optimierungspotenzial": [
    {
      "bereich": "...",
      "beschreibung": "...",
      "ersparnis_geschaetzt": "X€ pro Jahr",
      "aufwand": "gering|mittel|hoch",
      "tipp": "..."
    }
  ],
  "checkliste_jahresende": [
    {"aktion": "...", "frist": "31.12."}
  ],
  "disclaimer": "Dies ersetzt keine individuelle Steuerberatung."
}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { immobilien_info } = await req.json();

    const prompt = `Analysiere folgende Steuersituation für Vermieter und zeige Optimierungsmöglichkeiten:

${immobilien_info}

Gib konkrete, legale Steuerspar-Tipps für Vermieter.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2500,
        system: STEUER_OPTIMIERER_PROMPT,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      return Response.json({ error: result.error?.message || "API error" }, { status: 400 });
    }

    const content_text = result.content[0]?.text || "";
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!data) {
      return Response.json({ error: "Konnte Steuertipps nicht generieren" }, { status: 400 });
    }

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "steuer_optimierer",
      model: "claude-3-5-sonnet-20241022",
      tokens_used: result.usage.output_tokens + result.usage.input_tokens,
      cost_eur: ((result.usage.input_tokens * 0.003 + result.usage.output_tokens * 0.015) / 1000).toFixed(4)
    });

    return Response.json({
      ...data,
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