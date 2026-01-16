import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STEUER_OPTIMIERER_PROMPT = `Du bist ein Steuerberater, der legale Steuerspar-Möglichkeiten für Vermieter aufzeigt.

WICHTIG: Du gibst allgemeine Hinweise, keine individuelle Steuerberatung.
Empfehle bei komplexen Fällen immer einen Steuerberater.

FOKUS auf Immobilien/Vermietung:
- Anlage V Optimierung
- Werbungskosten maximieren
- AfA richtig nutzen
- Erhaltungsaufwand vs. Herstellungskosten
- Finanzierungskosten
- Fahrten zum Objekt

ANTWORTE IM JSON-FORMAT:
{
  "situation": {
    "immobilien_anzahl": 0,
    "vermietungsart": "privat|gewerblich|gemischt",
    "eigennutzung_anteil": 0,
    "finanziert": true|false
  },
  "aktuelle_abzuege": [
    {
      "kategorie": "AfA|Zinsen|Erhaltung|Nebenkosten|Fahrtkosten|...",
      "geschaetzter_betrag": 0,
      "voll_ausgeschoepft": true|false
    }
  ],
  "optimierungspotenzial": [
    {
      "bereich": "...",
      "beschreibung": "...",
      "ersparnis_geschaetzt": "X € pro Jahr",
      "aufwand": "gering|mittel|hoch",
      "umsetzung": "sofort|zum_jahresende|naechstes_jahr",
      "tipp": "Konkreter Umsetzungstipp"
    }
  ],
  "checkliste_jahresende": [
    {"aktion": "...", "frist": "31.12.", "potenzial": "..."}
  ],
  "anlage_v_tipps": [
    {"zeile": "...", "tipp": "..."}
  ],
  "wichtige_fristen": [
    {"was": "...", "wann": "..."}
  ],
  "empfehlung_steuerberater": true|false,
  "begruendung_steuerberater": "...",
  "disclaimer": "Dies ersetzt keine individuelle Steuerberatung."
}`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { situation } = await req.json();

        if (!situation) {
            return Response.json({ error: 'situation is required' }, { status: 400 });
        }

        const prompt = `Analysiere meine Steuersituation und zeige Optimierungspotenzial auf:

${situation.immobilien_anzahl ? `Anzahl Immobilien: ${situation.immobilien_anzahl}` : ''}
${situation.jahreseinkommen ? `Jahreseinkommen aus Vermietung: ${situation.jahreseinkommen}€` : ''}
${situation.finanziert ? 'Finanziert: Ja' : 'Finanziert: Nein'}
${situation.zusatzinfo ? `\n${situation.zusatzinfo}` : ''}`;

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'steuer_optimierer',
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: STEUER_OPTIMIERER_PROMPT
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
        console.error('Steuer-Optimierer error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});