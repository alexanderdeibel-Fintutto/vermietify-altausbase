import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PORTFOLIO_PROMPT = `Du bist ein erfahrener Immobilien-Portfolio-Berater.

WICHTIG: Du gibst KEINE konkreten Kaufempfehlungen für einzelne Objekte,
sondern analysierst die Struktur und gibst strategische Hinweise.

ANTWORTE IM JSON-FORMAT:
{
  "portfolio_uebersicht": {
    "anzahl_objekte": 0,
    "gesamtwert_geschaetzt": 0,
    "gesamte_mieteinnahmen_jaehrlich": 0,
    "durchschnittliche_rendite": 0,
    "gesamte_darlehen": 0,
    "eigenkapitalquote": 0
  },
  "diversifikation": {
    "nach_lage": [
      {"region": "...", "anzahl": 0, "anteil_prozent": 0}
    ],
    "nach_baujahr": [
      {"zeitraum": "vor 1950", "anzahl": 0}
    ],
    "bewertung": "gut|mittel|schlecht",
    "kommentar": "..."
  },
  "risiko_analyse": {
    "gesamtrisiko": "niedrig|mittel|hoch",
    "klumpenrisiken": ["..."],
    "leerstandsrisiko": "...",
    "zinsaenderungsrisiko": "..."
  },
  "top_performer": [
    {"objekt": "...", "rendite": 0}
  ],
  "optimierungspotenzial": [
    {
      "bereich": "...",
      "empfehlung": "...",
      "prioritaet": "hoch|mittel|niedrig"
    }
  ]
}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { portfolio_daten } = await req.json();

    const prompt = `Analysiere dieses Immobilien-Portfolio und gib strategische Hinweise:

${portfolio_daten}

Antworte im JSON-Format mit Portfolio-Übersicht, Diversifikation, Risikoanalyse und Optimierungsvorschlägen.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        system: PORTFOLIO_PROMPT,
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
      return Response.json({ error: "Konnte Portfolio nicht analysieren" }, { status: 400 });
    }

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "portfolio_analyse",
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