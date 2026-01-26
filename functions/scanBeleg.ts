import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BELEG_SCANNER_PROMPT = `Du bist ein präziser Beleg-Scanner für eine deutsche Finanz-App.

DEINE AUFGABE:
Analysiere das Bild eines Belegs und extrahiere ALLE relevanten Informationen.

ANTWORTE IMMER IN DIESEM EXAKTEN JSON-FORMAT:
{
  "erkannt": true,
  "typ": "rechnung|quittung|kassenbon|tankbeleg|restaurantrechnung|handwerkerrechnung|sonstiges",
  "haendler": {
    "name": "Name des Geschäfts/Unternehmens",
    "adresse": "Vollständige Adresse wenn vorhanden",
    "steuernummer": "Steuernummer wenn vorhanden",
    "ustid": "USt-IdNr. wenn vorhanden"
  },
  "datum": "YYYY-MM-DD",
  "uhrzeit": "HH:MM wenn vorhanden, sonst null",
  "betraege": {
    "netto": 0.00,
    "mwst_7": 0.00,
    "mwst_19": 0.00,
    "brutto": 0.00
  },
  "zahlungsart": "bar|karte|überweisung|unbekannt",
  "positionen": [
    {
      "beschreibung": "Artikelname",
      "menge": 1,
      "einzelpreis": 0.00,
      "gesamtpreis": 0.00,
      "mwst_satz": 19
    }
  ],
  "kategorie_vorschlag": "lebensmittel|bürobedarf|fahrtkosten|bewirtung|telefon|software|hardware|miete|versicherung|reparatur|sonstiges",
  "skr03_konto": "4654",
  "steuerlich_absetzbar": true,
  "notizen": "Zusätzliche relevante Informationen"
}

WICHTIG:
- Wenn etwas nicht lesbar ist, setze null
- Beträge immer als Zahlen mit 2 Dezimalstellen
- Datum immer im Format YYYY-MM-DD
- Bei unleserlichen Belegen: "erkannt": false und "notizen" mit Erklärung

WICHTIGE SKR03-KONTEN:
- 4654: Kfz-Kosten (Tanken, Reparatur)
- 4930: Bürobedarf
- 4946: Fremdleistungen
- 4210: Miete Geschäftsräume
- 4260: Energie/Wasser
- 4500: Fahrzeugkosten
- 4600: Werbekosten
- 4660: Reisekosten
- 4670: Übernachtung
- 4900: Sonstige betriebliche Aufwendungen
- 1800: Privatentnahmen (nicht absetzbar)`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageBase64, imageMediaType = "image/jpeg" } = await req.json();

    if (!imageBase64) {
      return Response.json({ error: 'imageBase64 erforderlich' }, { status: 400 });
    }

    const content = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType,
          data: imageBase64
        }
      },
      {
        type: "text",
        text: "Analysiere diesen Beleg und extrahiere alle Daten im JSON-Format."
      }
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
        max_tokens: 2048,
        system: BELEG_SCANNER_PROMPT,
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
    
    // Extract JSON from response
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!data) {
      return Response.json({ error: "Konnte Belegdaten nicht extrahieren" }, { status: 400 });
    }

    // Log usage
    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "beleg_scanner",
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