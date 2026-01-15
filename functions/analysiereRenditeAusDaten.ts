import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RENDITE_PROMPT = `Du bist ein erfahrener Immobilienanalyst, der Kaufentscheidungen für Kapitalanleger bewertet.

DEINE AUFGABE:
Berechne alle relevanten Renditekennzahlen und gib eine fundierte Bewertung.

ANTWORTE IM JSON-FORMAT:
{
  "objektdaten": {
    "kaufpreis": 0,
    "wohnflaeche_qm": 0,
    "baujahr": 0,
    "zustand": "...",
    "preis_pro_qm": 0
  },
  "einnahmen": {
    "kaltmiete_monatlich": 0,
    "kaltmiete_jaehrlich": 0,
    "effektive_mieteinnahmen": 0
  },
  "kaufnebenkosten": {
    "grunderwerbsteuer": 0,
    "notar": 0,
    "makler": 0,
    "gesamt": 0,
    "gesamt_prozent": 0
  },
  "laufende_kosten": {
    "hausgeld_monatlich": 0,
    "gesamt_jaehrlich": 0
  },
  "finanzierung": {
    "eigenkapital": 0,
    "eigenkapital_prozent": 0,
    "darlehen": 0,
    "zinssatz_prozent": 0,
    "tilgung_prozent": 0,
    "monatliche_rate": 0,
    "jaehrliche_zinsen": 0
  },
  "renditen": {
    "bruttomietrendite": 0.00,
    "nettomietrendite": 0.00,
    "eigenkapitalrendite": 0.00,
    "cashflow_monatlich": 0,
    "cashflow_jaehrlich": 0
  },
  "bewertung": {
    "gesamtnote": "sehr_gut|gut|mittel|schlecht",
    "empfehlung": "kaufen|verhandeln|ablehnen",
    "begruendung": "..."
  }
}

FORMELN:
- Bruttomietrendite = (Jahreskaltmiete / Kaufpreis) × 100
- Nettomietrendite = ((Jahresmiete - Kosten) / (Kaufpreis + Nebenkosten)) × 100
- Eigenkapitalrendite = ((Mietüberschuss - Zinsen) / Eigenkapital) × 100`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kaufpreis, wohnflaeche, baujahr, bundesland, kaltmiete, hausgeld, eigenkapital, zinssatz, tilgung } = await req.json();

    if (!kaufpreis || !kaltmiete) {
      return Response.json({ error: 'Erforderliche Felder: kaufpreis, kaltmiete' }, { status: 400 });
    }

    const prompt = `Berechne die Rendite für folgende Immobilie:
    
Kaufpreis: ${kaufpreis}€
Wohnfläche: ${wohnflaeche}qm
Baujahr: ${baujahr}
Bundesland: ${bundesland}
Kaltmiete: ${kaltmiete}€/Monat
Hausgeld: ${hausgeld}€/Monat
Eigenkapital: ${eigenkapital}€
Zinssatz: ${zinssatz}%
Tilgung: ${tilgung}%

Berechne alle Renditekennzahlen und gib eine Bewertung.`;

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
        system: RENDITE_PROMPT,
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
      return Response.json({ error: "Konnte Rendite nicht berechnen" }, { status: 400 });
    }

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "rendite_analyse",
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