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
- 1800: Privatentnahmen (Lebensmittel, Kleidung, etc.)
- 1890: Privateinlagen

IMMOBILIEN-SPEZIFISCH:
- 4210: Miete/Pacht
- 4211: Grundsteuer
- 4212: Gebäudeversicherung
- 4213: Hausverwaltungskosten
- 4240: Gas/Strom/Wasser
- 2100: Abschreibung Gebäude`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageBase64, imageMediaType } = await req.json();

        if (!imageBase64) {
            return Response.json({ error: 'imageBase64 is required' }, { status: 400 });
        }

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'buchungs_kategorisierer',
            messages: [{
                role: 'user',
                content: 'Kategorisiere diese Buchungen nach SKR03.'
            }],
            systemPrompt: BUCHUNGS_KATEGORISIERER_PROMPT,
            imageBase64,
            imageMediaType: imageMediaType || 'image/jpeg'
        });

        if (!result.data.success) {
            throw new Error(result.data.error || 'AI-Aufruf fehlgeschlagen');
        }

        let data;
        try {
            data = JSON.parse(result.data.content);
        } catch {
            const jsonMatch = result.data.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                data = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Konnte JSON nicht extrahieren');
            }
        }

        return Response.json({
            success: true,
            data,
            meta: {
                provider: result.data.provider,
                model: result.data.model,
                costEur: result.data.costEur
            }
        });

    } catch (error) {
        console.error('Buchungs-Kategorisierer error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});