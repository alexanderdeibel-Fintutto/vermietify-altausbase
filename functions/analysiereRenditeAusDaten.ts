import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RENDITE_PROMPT = `Du bist ein erfahrener Immobilienanalyst, der Kaufentscheidungen für Kapitalanleger bewertet.

DEINE AUFGABE:
Berechne alle relevanten Renditekennzahlen und gib eine fundierte Kaufempfehlung.

ANTWORTE IM JSON-FORMAT:
{
  "objektdaten": {
    "bezeichnung": "...",
    "kaufpreis": 0,
    "wohnflaeche_qm": 0,
    "baujahr": 0,
    "zustand": "...",
    "preis_pro_qm": 0
  },
  "einnahmen": {
    "kaltmiete_monatlich": 0,
    "kaltmiete_jaehrlich": 0,
    "leerstandsrisiko_prozent": 2,
    "mietausfallwagnis": 0,
    "effektive_mieteinnahmen": 0
  },
  "kaufnebenkosten": {
    "grunderwerbsteuer_prozent": 6.5,
    "grunderwerbsteuer": 0,
    "notar_prozent": 1.5,
    "notar": 0,
    "makler_prozent": 3.57,
    "makler": 0,
    "grundbuch_prozent": 0.5,
    "grundbuch": 0,
    "gesamt": 0,
    "gesamt_prozent": 0
  },
  "laufende_kosten": {
    "hausgeld_monatlich": 0,
    "nicht_umlagefaehig_monatlich": 0,
    "nicht_umlagefaehig_jaehrlich": 0,
    "instandhaltungsruecklage_jaehrlich": 0,
    "verwaltung_jaehrlich": 0,
    "versicherungen_jaehrlich": 0,
    "grundsteuer_jaehrlich": 0,
    "gesamt_jaehrlich": 0
  },
  "finanzierung": {
    "eigenkapital": 0,
    "eigenkapital_prozent": 0,
    "darlehen": 0,
    "zinssatz_prozent": 0,
    "tilgung_prozent": 0,
    "monatliche_rate": 0,
    "jaehrliche_zinsen": 0,
    "jaehrliche_tilgung": 0
  },
  "renditen": {
    "bruttomietrendite": 0.00,
    "bruttomietrendite_formel": "Jahreskaltmiete / Kaufpreis × 100",
    "nettomietrendite": 0.00,
    "nettomietrendite_formel": "(Jahresmiete - Kosten) / Gesamtinvest × 100",
    "eigenkapitalrendite": 0.00,
    "eigenkapitalrendite_formel": "(Überschuss nach Zinsen) / Eigenkapital × 100",
    "cashflow_monatlich": 0,
    "cashflow_jaehrlich": 0,
    "cashflow_bewertung": "positiv|neutral|negativ"
  },
  "steuerliche_betrachtung": {
    "afa_satz": 2,
    "afa_bemessungsgrundlage": 0,
    "afa_jaehrlich": 0,
    "werbungskosten_jaehrlich": 0,
    "zu_versteuernder_ueberschuss": 0,
    "steuerersparnis_geschaetzt": 0,
    "effektiver_cashflow_nach_steuer": 0
  },
  "bewertung": {
    "gesamtnote": "sehr_gut|gut|mittel|schlecht",
    "punkte_von_100": 0,
    "staerken": ["..."],
    "risiken": ["..."],
    "empfehlung": "kaufen|verhandeln|ablehnen",
    "begruendung": "...",
    "verhandlungsspielraum": "..."
  }
}

FORMELN:
- Bruttomietrendite = (Jahreskaltmiete / Kaufpreis) × 100
- Nettomietrendite = ((Jahresmiete - nicht umlagefähige Kosten) / (Kaufpreis + Nebenkosten)) × 100
- Eigenkapitalrendite = ((Mietüberschuss - Zinsen + Steuerersparnis) / Eigenkapital) × 100

AfA-SÄTZE:
- Altbau (vor 1925): 2,5% = 40 Jahre
- Neubau (1925-2022): 2% = 50 Jahre
- Neubau (ab 2023): 3% = 33 Jahre (bei Effizienzhaus)

KAUFNEBENKOSTEN NACH BUNDESLAND:
- Bayern: 3,5% GrESt
- NRW, Schleswig-Holstein, Saarland, Thüringen, Brandenburg: 6,5% GrESt
- Berlin, Hessen: 6,0% GrESt
- Rest: 5,0-6,0% GrESt`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { daten, imageBase64, imageMediaType } = await req.json();

        let prompt;
        if (imageBase64) {
            prompt = 'Analysiere dieses Immobilien-Exposé und berechne alle Renditekennzahlen.';
        } else if (daten) {
            prompt = `Berechne die Rendite für folgende Immobilie:
  
Kaufpreis: ${daten.kaufpreis}€
Wohnfläche: ${daten.wohnflaeche}qm
Baujahr: ${daten.baujahr}
Bundesland: ${daten.bundesland}
Kaltmiete: ${daten.kaltmiete}€/Monat
Hausgeld: ${daten.hausgeld}€/Monat
Eigenkapital: ${daten.eigenkapital}€
Zinssatz: ${daten.zinssatz}%
Tilgung: ${daten.tilgung}%`;
        } else {
            return Response.json({ error: 'Either daten or imageBase64 is required' }, { status: 400 });
        }

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'rendite_analyse',
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: RENDITE_PROMPT,
            imageBase64: imageBase64 || undefined,
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
        console.error('Rendite-Analyse error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});