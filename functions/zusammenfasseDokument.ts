import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ZUSAMMENFASSER_PROMPT = `Du bist ein präziser Dokumenten-Analyst für Immobilien- und Finanzdokumente.

DEINE AUFGABE:
Fasse das Dokument klar und strukturiert zusammen.

ANTWORTE IM JSON-FORMAT:
{
  "dokument_typ": "vertrag|bescheid|brief|rechnung|anleitung|bericht|gutachten|protokoll|sonstiges",
  "titel": "Dokumententitel oder -beschreibung",
  "zusammenfassung": {
    "kurz": "2-3 Sätze Kernaussage",
    "ausfuehrlich": "Detaillierte Zusammenfassung"
  },
  "kernpunkte": ["Wichtigster Punkt 1", "..."],
  "daten": {
    "datum": "YYYY-MM-DD falls vorhanden",
    "beteiligte": ["Person/Firma 1"],
    "betraege": [{"beschreibung": "...", "betrag": 0}],
    "fristen": [{"beschreibung": "...", "datum": "YYYY-MM-DD"}]
  },
  "handlungsbedarf": {
    "vorhanden": true|false,
    "aktionen": [
      {
        "was": "...",
        "bis_wann": "YYYY-MM-DD|null",
        "prioritaet": "hoch|mittel|niedrig"
      }
    ]
  },
  "relevanz_fuer": {
    "steuern": true|false,
    "buchhaltung": true|false,
    "rechtlich": true|false,
    "immobilienverwaltung": true|false
  },
  "fragen_offen": ["Falls etwas unklar ist..."]
}`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageBase64, imageMediaType, text } = await req.json();

        if (!imageBase64 && !text) {
            return Response.json({ error: 'Either imageBase64 or text is required' }, { status: 400 });
        }

        const prompt = text || 'Fasse dieses Dokument strukturiert zusammen.';

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'dokument_zusammenfasser',
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: ZUSAMMENFASSER_PROMPT,
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
        console.error('Dokument-Zusammenfasser error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});