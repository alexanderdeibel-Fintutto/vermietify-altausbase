import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MIETVERTRAG_PROMPT = `Du bist ein erfahrener Mietrechts-Experte, der Mietverträge für Verbraucher prüft.

DEINE AUFGABE:
Analysiere den Mietvertrag gründlich und identifiziere alle wichtigen und potenziell problematischen Klauseln.

ANTWORTE IM FOLGENDEN JSON-FORMAT:
{
  "zusammenfassung": {
    "mietobjekt": "Adresse und Beschreibung",
    "vermieter": "Name des Vermieters",
    "mieter": "Name des Mieters",
    "mietbeginn": "YYYY-MM-DD",
    "befristung": "unbefristet|befristet bis YYYY-MM-DD",
    "kaltmiete": 0.00,
    "nebenkosten": 0.00,
    "kaution": 0.00,
    "gesamtmiete": 0.00
  },
  "bewertung": {
    "gesamtnote": "gut|mittel|kritisch",
    "kurzfassung": "1-2 Sätze Gesamteindruck"
  },
  "klauseln": [
    {
      "thema": "Name der Klausel",
      "originaltext": "Zitat aus dem Vertrag",
      "bewertung": "ok|achtung|unwirksam",
      "erklaerung": "Was bedeutet das für den Mieter?",
      "handlungsempfehlung": "Was sollte der Mieter tun?"
    }
  ],
  "tipps": [
    "Konkrete Tipps für den Mieter"
  ]
}

ACHTE BESONDERS AUF:
- Schönheitsreparaturen (oft unwirksam bei starren Fristen!)
- Kündigungsfristen (max. 3 Monate für Mieter)
- Mieterhöhungsklauseln
- Tierhaltung
- Untervermietung
- Kleinreparaturklausel (Obergrenze max. ca. 100€ pro Reparatur)
- Betriebskostenabrechnung
- Kaution (max. 3 Monats-Kaltmieten!)`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imagesBase64 = [], imagesMediaTypes = [] } = await req.json();

    if (!imagesBase64 || imagesBase64.length === 0) {
      return Response.json({ error: 'imageBase64 erforderlich' }, { status: 400 });
    }

    const content = [];
    imagesBase64.forEach((img, idx) => {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imagesMediaTypes[idx] || "image/jpeg",
          data: img
        }
      });
    });
    
    content.push({
      type: "text",
      text: "Analysiere diesen Mietvertrag und prüfe alle Klauseln. Antworte im JSON-Format."
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
        max_tokens: 4000,
        system: MIETVERTRAG_PROMPT,
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
      return Response.json({ error: "Konnte Vertragsdaten nicht extrahieren" }, { status: 400 });
    }

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "mietvertrag_pruefer",
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