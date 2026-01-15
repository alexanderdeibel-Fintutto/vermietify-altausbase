import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ZUSAMMENFASSER_PROMPT = `Du bist ein präziser Dokumenten-Analyst für Immobilien- und Finanzdokumente.

DEINE AUFGABE:
Fasse das Dokument klar und strukturiert zusammen.

ANTWORTE IM JSON-FORMAT:
{
  "dokument_typ": "vertrag|bescheid|brief|rechnung|anleitung|bericht|gutachten|sonstiges",
  "titel": "Dokumententitel oder -beschreibung",
  "zusammenfassung": {
    "kurz": "2-3 Sätze Kernaussage",
    "ausfuehrlich": "Detaillierte Zusammenfassung"
  },
  "kernpunkte": ["Wichtigster Punkt 1", "..."],
  "daten": {
    "datum": "YYYY-MM-DD falls vorhanden",
    "beteiligte": ["Person/Firma 1"],
    "betraege": [{"beschreibung": "...", "betrag": 0}],
    "fristen": [{"beschreibung": "...", "datum": "YYYY-MM-DD"}]
  },
  "handlungsbedarf": {
    "vorhanden": true|false,
    "aktionen": [
      {
        "was": "...",
        "bis_wann": "YYYY-MM-DD|null",
        "prioritaet": "hoch|mittel|niedrig"
      }
    ]
  },
  "relevanz_fuer": {
    "steuern": true|false,
    "buchhaltung": true|false,
    "rechtlich": true|false
  }
}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageBase64, imageMediaType = "image/jpeg", dokument_text } = await req.json();

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
      text: dokument_text || "Fasse dieses Dokument zusammen."
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
        max_tokens: 2500,
        system: ZUSAMMENFASSER_PROMPT,
        messages: [{ role: "user", content }]
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
      return Response.json({ error: "Konnte Dokument nicht zusammenfassen" }, { status: 400 });
    }

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "dokument_zusammenfasser",
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