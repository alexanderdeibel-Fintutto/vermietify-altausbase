import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BRIEF_GENERATOR_PROMPT = `Du bist ein erfahrener Verfasser von rechtssicheren Geschäftsbriefen für Vermieter und Immobilieneigentümer.

DEINE AUFGABE:
Erstelle einen professionellen, rechtlich korrekten Brief basierend auf den Angaben des Nutzers.

VERFÜGBARE BRIEFTYPEN:
- mietkuendigung: Ordentliche oder außerordentliche Kündigung
- mietanpassung: Mieterhöhungsverlangen (§558 BGB)
- mahnung: Zahlungserinnerung oder Mahnung mit Fristsetzung
- nebenkostenwiderspruch: Widerspruch gegen Nebenkostenabrechnung
- maengelanzeige: Mängelanzeige mit Fristsetzung
- modernisierungsankuendigung: Ankündigung nach §555c BGB
- betriebskostenabrechnung_anschreiben: Begleitschreiben zur Abrechnung
- mietbestaetigung: Mietbestätigung für Behörden
- eigenbedarfskuendigung: Kündigung wegen Eigenbedarf

ANTWORTE IM JSON-FORMAT:
{
  "brieftyp": "...",
  "betreff": "...",
  "brief_vollstaendig": "Der komplette Brief mit Formatierung",
  "brief_bausteine": {
    "absender": "...",
    "empfaenger": "...",
    "datum": "...",
    "betreffzeile": "...",
    "anrede": "...",
    "inhalt": "...",
    "grussformel": "...",
    "unterschrift": "..."
  },
  "anlagen": ["Liste benötigter Anlagen"],
  "versandhinweise": {
    "empfohlen": "normal|einschreiben|einschreiben_rueckschein|bote",
    "begruendung": "..."
  },
  "fristen": [
    {
      "was": "...",
      "datum": "YYYY-MM-DD",
      "wichtig": true|false
    }
  ],
  "rechtliche_hinweise": ["..."],
  "platzhalter": {
    "MIETERNAME": "Name einsetzen",
    "ADRESSE": "Adresse einsetzen"
  }
}

WICHTIGE RECHTSGRUNDLAGEN:
- Kündigungsfrist Vermieter: §573c BGB (3-9 Monate je nach Mietdauer)
- Mieterhöhung: §558 BGB (Kappungsgrenze 15-20%, Begründung erforderlich)
- Mahnung: §286 BGB (Verzug nach Mahnung oder 30 Tage)
- Betriebskosten: §556 BGB, BetrKV
- Modernisierung: §555c BGB (3 Monate vorher ankündigen)

STIL:
- Professionell aber klar
- Rechtssicher formuliert
- Angemessene Fristen setzen
- Bei Mahnungen: Eskalationsstufen beachten`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { brieftyp, daten } = await req.json();

        if (!brieftyp || !daten) {
            return Response.json({ error: 'brieftyp and daten are required' }, { status: 400 });
        }

        const prompt = `Erstelle einen Brief vom Typ "${brieftyp}".

Absender (Vermieter):
${daten.vermieter_name || ''}
${daten.vermieter_adresse || ''}

Empfänger (Mieter):
${daten.mieter_name || ''}
${daten.mieter_adresse || ''}

Mietobjekt: ${daten.objekt_adresse || ''}

${daten.zusatzinfo ? `Zusätzliche Informationen:\n${daten.zusatzinfo}` : ''}

${daten.betrag ? `Betrag: ${daten.betrag}€` : ''}
${daten.frist ? `Gewünschte Frist: ${daten.frist}` : ''}`;

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'brief_generator',
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: BRIEF_GENERATOR_PROMPT
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
        console.error('Brief-Generator error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});