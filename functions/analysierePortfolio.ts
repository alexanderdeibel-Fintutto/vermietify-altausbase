import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PORTFOLIO_PROMPT = `Du bist ein erfahrener Immobilien-Portfolio-Berater.

WICHTIG: Du gibst KEINE konkreten Kaufempfehlungen für einzelne Objekte,
sondern analysierst die Struktur und gibst strategische Hinweise.

ANTWORTE IM JSON-FORMAT:
{
  "portfolio_uebersicht": {
    "anzahl_objekte": 0,
    "gesamtwert_geschaetzt": 0,
    "gesamte_mieteinnahmen_monatlich": 0,
    "gesamte_mieteinnahmen_jaehrlich": 0,
    "durchschnittliche_rendite": 0,
    "gesamte_darlehen": 0,
    "eigenkapitalquote": 0
  },
  "diversifikation": {
    "nach_objekttyp": [
      {"typ": "Wohnung", "anzahl": 0, "anteil_prozent": 0}
    ],
    "nach_lage": [
      {"stadt": "...", "anzahl": 0, "anteil_prozent": 0}
    ],
    "nach_baujahr": [
      {"zeitraum": "vor 1950", "anzahl": 0}
    ],
    "bewertung": "gut|mittel|schlecht",
    "kommentar": "..."
  },
  "risiko_analyse": {
    "gesamtrisiko": "niedrig|mittel|hoch",
    "klumpenrisiken": ["..."],
    "leerstandsrisiko": "...",
    "zinsaenderungsrisiko": "...",
    "instandhaltungsrisiko": "..."
  },
  "performance_analyse": {
    "top_performer": [{"objekt": "...", "rendite": 0}],
    "low_performer": [{"objekt": "...", "rendite": 0, "grund": "..."}],
    "optimierungspotenzial": ["..."]
  },
  "empfehlungen": [
    {
      "bereich": "...",
      "aktuell": "...",
      "empfehlung": "...",
      "prioritaet": "hoch|mittel|niedrig",
      "begruendung": "..."
    }
  ],
  "naechste_schritte": ["..."],
  "disclaimer": "Dies ist keine Anlageberatung. Konsultiere einen Steuerberater/Finanzberater."
}`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const buildings = await base44.entities.Building.list();

        if (!buildings || buildings.length === 0) {
            return Response.json({ error: 'Keine Gebäude gefunden' }, { status: 404 });
        }

        const portfolioData = buildings.map(b => ({
            bezeichnung: b.bezeichnung || b.strasse,
            wert: b.kaufpreis || 0,
            baujahr: b.baujahr,
            stadt: b.stadt || b.ort,
            typ: b.objektart || 'Wohnung'
        }));

        const prompt = `Analysiere dieses Immobilien-Portfolio:

${JSON.stringify(portfolioData, null, 2)}

Gib eine strategische Analyse mit Empfehlungen.`;

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'portfolio_analyse',
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: PORTFOLIO_PROMPT
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
        console.error('Portfolio-Analyse error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});