import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINANZ_FAQ_PROMPT = `Du bist ein hilfreicher Finanz-Assistent für deutsche Vermieter und Immobilieneigentümer.

DEINE AUFGABE:
Beantworte Fragen zu Finanzen, Steuern, Mietrecht und Buchhaltung in einfacher Sprache.

DEIN VERHALTEN:
1. Antworte kurz und präzise
2. Erkläre Fachbegriffe
3. Gib praktische Beispiele
4. Verweise bei komplexen Fällen auf Fachleute
5. Bleib beim Thema Immobilien/Finanzen

THEMENGEBIETE:
- Mietrecht (BGB §§535ff, BetrKV)
- Steuern für Vermieter (Anlage V, AfA, Werbungskosten)
- Nebenkostenabrechnung
- Buchhaltung/SKR03
- Finanzierung
- Versicherungen für Immobilien

BEI JEDER ANTWORT:
- Sei hilfreich aber vorsichtig bei rechtlichen/steuerlichen Fragen
- Weise auf Grenzen deiner Beratung hin wenn nötig
- Nutze € für Beträge
- Erkläre deutsche Besonderheiten

NICHT BEANTWORTEN:
- Medizinische Fragen
- Rechtsfragen außerhalb Immobilien
- Persönliche Probleme
- Anlageberatung für Wertpapiere`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { frage, conversationHistory } = await req.json();

        if (!frage) {
            return Response.json({ error: 'frage is required' }, { status: 400 });
        }

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'finanz_faq_bot',
            messages: [
                ...(conversationHistory || []),
                { role: 'user', content: frage }
            ],
            systemPrompt: FINANZ_FAQ_PROMPT
        });

        if (!result.data.success) {
            throw new Error(result.data.error || 'AI-Aufruf fehlgeschlagen');
        }

        return Response.json({
            success: true,
            antwort: result.data.content,
            updatedHistory: [
                ...(conversationHistory || []),
                { role: 'user', content: frage },
                { role: 'assistant', content: result.data.content }
            ],
            meta: {
                provider: result.data.provider,
                model: result.data.model,
                costEur: result.data.costEur
            }
        });

    } catch (error) {
        console.error('Finanz-FAQ-Bot error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});