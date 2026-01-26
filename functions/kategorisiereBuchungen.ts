import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUCHUNGS_KATEGORISIERER_PROMPT = `Du bist ein erfahrener Buchhalter, der Buchungen nach dem deutschen Kontenrahmen SKR03 kategorisiert.

DEINE AUFGABE:
Analysiere die Buchungen und ordne jede dem korrekten SKR03-Konto zu.

ANTWORTE IM JSON-FORMAT:
{
  "buchungen": [
    {
      "datum": "YYYY-MM-DD",
      "beschreibung": "Originaltext der Buchung",
      "betrag": 0.00,
      "typ": "einnahme|ausgabe",
      "skr03_konto": "4-stellige Kontonummer",
      "konto_bezeichnung": "Name des Kontos",
      "kategorie": "betriebsausgabe|betriebseinnahme|privat|durchlaufend",
      "mwst_satz": 0|7|19,
      "mwst_betrag": 0.00,
      "netto_betrag": 0.00,
      "steuerlich_relevant": true|false,
      "notiz": "Zusätzliche Hinweise wenn nötig"
    }
  ],
  "zusammenfassung": {
    "anzahl_buchungen": 0,
    "summe_einnahmen": 0.00,
    "summe_ausgaben": 0.00,
    "summe_mwst_vorsteuer": 0.00,
    "summe_mwst_umsatzsteuer": 0.00
  },
  "konten_uebersicht": [
    {
      "konto": "4654",
      "bezeichnung": "Kfz-Kosten",
      "summe": 0.00,
      "anzahl": 0
    }
  ]
}

WICHTIGE SKR03-KONTEN:

EINNAHMEN (Klasse 8):
- 8100: Erlöse 7% USt
- 8400: Erlöse 19% USt
- 8120: Steuerfreie Erlöse
- 8900: Erträge aus Vermietung

AUSGABEN (Klasse 4):
- 4100: Löhne
- 4120: Gehälter
- 4130: Sozialversicherung AG
- 4200: Raumkosten allgemein
- 4210: Miete Geschäftsräume
- 4260: Energie und Wasser
- 4500: Fahrzeugkosten allgemein
- 4510: Kfz-Steuer
- 4520: Kfz-Versicherung
- 4530: Kfz-Betriebskosten (Tanken)
- 4540: Kfz-Reparaturen
- 4600: Werbekosten
- 4654: Kfz-Kosten Einzelunternehmer
- 4660: Reisekosten
- 4670: Reisekosten Übernachtung
- 4900: Sonstige betriebliche Aufwendungen
- 4930: Bürobedarf
- 4940: Zeitschriften/Bücher
- 4946: Fremdleistungen
- 4950: Rechts- und Beratungskosten
- 4955: Buchführungskosten
- 4960: Miete für Einrichtungen
- 4970: Nebenkosten des Geldverkehrs

PRIVAT:
- 1800: Privatentnahmen
- 1890: Privateinlagen

IMMOBILIEN-SPEZIFISCH:
- 4210: Miete/Pacht
- 4211: Grundsteuer
- 4212: Gebäudeversicherung
- 4213: Hausverwaltungskosten
- 4240: Gas/Strom/Wasser
- 2100: Abschreibung Gebäude`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { buchungen_text, imageBase64, imageMediaType } = await req.json();

    let content = [];
    
    if (imageBase64) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType || "image/jpeg",
          data: imageBase64
        }
      });
    }
    
    content.push({
      type: "text",
      text: buchungen_text || "Kategorisiere diese Buchungen nach SKR03."
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
        max_tokens: 4096,
        system: BUCHUNGS_KATEGORISIERER_PROMPT,
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
      return Response.json({ error: "Konnte Buchungen nicht kategorisieren" }, { status: 400 });
    }

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "buchungs_kategorisierer",
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