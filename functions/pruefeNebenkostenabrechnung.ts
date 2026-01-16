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
    "ist_nachzahlung": true|false
  },
  "formelle_pruefung": {
    "abrechnungsfrist_eingehalten": true|false,
    "frist_ablauf": "YYYY-MM-DD",
    "umlageschluessel_angegeben": true|false,
    "gesamtkosten_nachvollziehbar": true|false,
    "fehler": ["Liste formeller Fehler"]
  },
  "inhaltliche_pruefung": {
    "positionen": [
      {
        "bezeichnung": "Heizkosten",
        "gesamtkosten": 0.00,
        "anteil_mieter": 0.00,
        "umlageschluessel": "Verbrauch|Fläche|Personenzahl|etc.",
        "pruefung": "ok|auffaellig|fehlerhaft",
        "kommentar": "Erklärung"
      }
    ]
  },
  "nicht_umlagefaehige_kosten": [
    {
      "bezeichnung": "Verwaltungskosten",
      "betrag": 0.00,
      "grund": "§2 BetrKV: Verwaltungskosten nicht umlagefähig"
    }
  ],
  "ergebnis": {
    "empfehlung": "akzeptieren|pruefen_lassen|widerspruch_einlegen",
    "korrigierter_betrag": 0.00,
    "ersparnis": 0.00,
    "begruendung": "Zusammenfassung der Empfehlung",
    "widerspruchsfrist": "YYYY-MM-DD"
  },
  "widerspruch_vorlage": "Fertiger Widerspruchstext wenn empfohlen"
}

PRÜFE INSBESONDERE:
1. FORMELL:
   - Abrechnungsfrist (12 Monate nach Ende des Abrechnungszeitraums)
   - Vollständigkeit (Gesamtkosten, Verteilerschlüssel, Berechnung)

2. UMLAGEFÄHIGKEIT (§2 BetrKV):
   Umlagefähig: Grundsteuer, Wasser, Heizung, Warmwasser, Aufzug, Straßenreinigung, 
   Müllabfuhr, Gebäudereinigung, Gartenpflege, Beleuchtung, Schornsteinfeger, 
   Versicherungen, Hauswart, Gemeinschaftsantenne, Wascheinrichtung
   
   NICHT umlagefähig: Verwaltungskosten, Reparaturen, Instandhaltung, 
   Bankgebühren, Rechtskosten

3. HEIZKOSTEN (Heizkostenverordnung):
   - 50-70% nach Verbrauch
   - 30-50% nach Fläche
   - Keine reine Flächenabrechnung erlaubt!`;

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
            featureKey: 'nebenkosten_pruefer',
            messages: [{
                role: 'user',
                content: 'Prüfe diese Nebenkostenabrechnung auf formelle und inhaltliche Fehler.'
            }],
            systemPrompt: NEBENKOSTEN_PROMPT,
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
        console.error('Nebenkosten-Prüfer error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});