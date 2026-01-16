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
- 4500: Fahrzeugkosten allgemein
- 4600: Werbekosten
- 4660: Reisekosten
- 4670: Übernachtung
- 4900: Sonstige betriebliche Aufwendungen
- 1800: Privatentnahmen (nicht absetzbar)`;

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
            featureKey: 'beleg_scanner',
            messages: [{
                role: 'user',
                content: 'Analysiere diesen Beleg und extrahiere alle Daten im JSON-Format.'
            }],
            systemPrompt: BELEG_SCANNER_PROMPT,
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
        console.error('Beleg-Scanner error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});