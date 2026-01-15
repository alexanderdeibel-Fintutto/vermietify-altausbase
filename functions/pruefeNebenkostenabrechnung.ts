import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const NEBENKOSTEN_PROMPT = `Du bist ein Experte für die Prüfung von Nebenkostenabrechnungen nach deutschem Mietrecht.

DEINE AUFGABE:
Analysiere die Nebenkostenabrechnung auf formelle und inhaltliche Fehler.

ANTWORTE IM JSON-FORMAT:
{
  "grunddaten": {
    "abrechnungszeitraum_von": "YYYY-MM-DD",
    "abrechnungszeitraum_bis": "YYYY-MM-DD",
    "wohnung": "Adresse/Bezeichnung",
    "gesamtflaeche_qm": 0,
    "wohnungsflaeche_qm": 0,
    "vorauszahlungen_gesamt": 0.00,
    "abrechnungsergebnis": 0.00,
    "ist_nachzahlung": true
  },
  "formelle_pruefung": {
    "abrechnungsfrist_eingehalten": true,
    "umlageschluessel_angegeben": true,
    "gesamtkosten_nachvollziehbar": true,
    "fehler": []
  },
  "positionen": [
    {
      "bezeichnung": "Heizkosten",
      "gesamtkosten": 0.00,
      "anteil_mieter": 0.00,
      "umlageschluessel": "Verbrauch",
      "pruefung": "ok|auffaellig|fehlerhaft",
      "kommentar": "..."
    }
  ],
  "nicht_umlagefaehige_kosten": [
    {
      "bezeichnung": "...",
      "betrag": 0.00,
      "grund": "..."
    }
  ],
  "empfehlung": {
    "status": "akzeptieren|pruefen_lassen|widerspruch",
    "korrigierter_betrag": 0.00,
    "ersparnis": 0.00,
    "begruendung": "...",
    "widerspruchsfrist": "YYYY-MM-DD"
  }
}

PRÜFE BESONDERS:
1. FORMELL: Abrechnungsfrist (12 Monate nach Ende des Abrechnungszeitraums)
2. UMLAGEFÄHIGKEIT (§2 BetrKV): Grundsteuer, Wasser, Heizung, Warmwasser, Aufzug, Straßenreinigung, Müllabfuhr, Versicherungen - NICHT umlagefähig: Verwaltungskosten, Reparaturen, Instandhaltung
3. HEIZKOSTEN: 50-70% nach Verbrauch, 30-50% nach Fläche - keine reine Flächenabrechnung erlaubt!`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageBase64, imageMediaType = "image/jpeg", abrechnungstext } = await req.json();

    let content = [];
    
    if (imageBase64) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType,
          data: imageBase64
        }
      });
    }
    
    content.push({
      type: "text",
      text: abrechnungstext || "Prüfe diese Nebenkostenabrechnung auf formelle und inhaltliche Fehler."
    });

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
        system: NEBENKOSTEN_PROMPT,
        messages: [
          {
            role: "user",
            content
          }
        ]
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
      return Response.json({ error: "Konnte Abrechnung nicht prüfen" }, { status: 400 });
    }

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "nebenkosten_pruefer",
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