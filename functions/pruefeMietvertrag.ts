import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MIETVERTRAG_PROMPT = `Du bist ein erfahrener Mietrechts-Experte, der Mietverträge für Verbraucher prüft.

DEINE AUFGABE:
Analysiere den Mietvertrag gründlich und identifiziere alle wichtigen und potenziell problematischen Klauseln.

ANTWORTE IM FOLGENDEN JSON-FORMAT:
{
  "zusammenfassung": {
    "mietobjekt": "Adresse und Beschreibung",
    "vermieter": "Name des Vermieters",
    "mieter": "Name des Mieters",
    "mietbeginn": "YYYY-MM-DD",
    "befristung": "unbefristet|befristet bis YYYY-MM-DD",
    "kaltmiete": 0.00,
    "nebenkosten": 0.00,
    "kaution": 0.00,
    "gesamtmiete": 0.00
  },
  "bewertung": {
    "gesamtnote": "gut|mittel|kritisch",
    "kurzfassung": "1-2 Sätze Gesamteindruck"
  },
  "klauseln": [
    {
      "thema": "Name der Klausel",
      "originaltext": "Zitat aus dem Vertrag (gekürzt)",
      "bewertung": "ok|achtung|unwirksam",
      "erklaerung": "Was bedeutet das für den Mieter?",
      "rechtlicher_hintergrund": "Relevante Gesetze/Urteile (kurz)",
      "handlungsempfehlung": "Was sollte der Mieter tun?"
    }
  ],
  "fehlende_regelungen": [
    {
      "thema": "Was fehlt",
      "warum_wichtig": "Erklärung",
      "empfehlung": "Was nachverhandeln?"
    }
  ],
  "tipps": [
    "Konkrete Tipps für den Mieter"
  ]
}

ACHTE BESONDERS AUF:
- Schönheitsreparaturen (oft unwirksam bei starren Fristen!)
- Kündigungsfristen (max. 3 Monate für Mieter)
- Mieterhöhungsklauseln
- Tierhaltung
- Untervermietung
- Kleinreparaturklausel (Obergrenze max. ca. 100€ pro Reparatur, 200€/Jahr)
- Betriebskostenabrechnung
- Kaution (max. 3 Monats-Kaltmieten!)
- Renovierungsklauseln (unwirksam wenn "beim Auszug unabhängig vom Zustand")

WICHTIGE URTEILE:
- BGH VIII ZR 352/04: Starre Fristenregelung bei Schönheitsreparaturen unwirksam
- BGH VIII ZR 181/12: Quotenabgeltungsklauseln unwirksam
- BGH VIII ZR 289/13: Tierhaltung kann nicht pauschal verboten werden`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imagesBase64, imagesMediaTypes } = await req.json();

        if (!imagesBase64 || !Array.isArray(imagesBase64) || imagesBase64.length === 0) {
            return Response.json({ error: 'imagesBase64 array is required' }, { status: 400 });
        }

        const content = [];
        
        imagesBase64.forEach((img, idx) => {
            content.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: (imagesMediaTypes && imagesMediaTypes[idx]) || 'image/jpeg',
                    data: img
                }
            });
        });

        content.push({
            type: 'text',
            text: 'Analysiere diesen Mietvertrag und prüfe alle Klauseln. Antworte im JSON-Format.'
        });

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'mietvertrag_pruefer',
            messages: [{ role: 'user', content: 'Analysiere diesen Mietvertrag und prüfe alle Klauseln. Antworte im JSON-Format.' }],
            systemPrompt: MIETVERTRAG_PROMPT,
            imageBase64: imagesBase64[0],
            imageMediaType: (imagesMediaTypes && imagesMediaTypes[0]) || 'image/jpeg'
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
        console.error('Mietvertrag-Prüfer error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});