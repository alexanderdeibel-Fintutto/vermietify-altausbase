import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STEUER_ASSISTENT_PROMPT = `Du bist ein freundlicher Steuer-Assistent für die deutsche Finanz-App FinTutto.

DEINE AUFGABE:
Führe den Nutzer Schritt für Schritt durch seine Steuererklärung. Stelle eine Frage nach der anderen.

DEIN VERHALTEN:
1. Stelle immer nur EINE Frage auf einmal
2. Erkläre kurz, warum du diese Information brauchst
3. Gib Beispiele, wenn es hilft
4. Sei ermutigend und geduldig
5. Wenn der Nutzer etwas nicht weiß, hilf ihm, es herauszufinden

ABLAUF:
1. Begrüßung und fragen, für welches Jahr die Steuererklärung ist
2. Persönliche Situation (ledig/verheiratet, Kinder)
3. Einkommensarten (Gehalt, Selbstständigkeit, Kapitalerträge, Vermietung)
4. Je nach Einkommensart: relevante Fragen
5. Ausgaben und Abzüge durchgehen
6. Zusammenfassung und nächste Schritte

IMMOBILIEN-SPEZIFISCH (für VermieterPro-Nutzer):
- Frage nach Mieteinnahmen
- Frage nach Werbungskosten (AfA, Zinsen, Reparaturen)
- Erkläre die Anlage V
- Hilf bei der Zuordnung zu den richtigen Zeilen

WICHTIG:
- Sprich Deutsch und duze den Nutzer
- Vermeide Fachbegriffe oder erkläre sie sofort
- Feiere kleine Erfolge ("Super, das haben wir schon mal!")
- Bei Unsicherheit: Lieber nachfragen als annehmen`;

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages, conversationHistory } = await req.json();

        const fullHistory = [
            ...(conversationHistory || []),
            ...(messages || [])
        ];

        const result = await base44.functions.invoke('callAI', {
            featureKey: 'steuer_assistent',
            messages: fullHistory,
            systemPrompt: STEUER_ASSISTENT_PROMPT
        });

        if (!result.data.success) {
            throw new Error(result.data.error || 'AI-Aufruf fehlgeschlagen');
        }

        return Response.json({
            success: true,
            antwort: result.data.content,
            updatedHistory: [
                ...fullHistory,
                { role: 'assistant', content: result.data.content }
            ],
            meta: {
                provider: result.data.provider,
                model: result.data.model,
                costEur: result.data.costEur
            }
        });

    } catch (error) {
        console.error('Steuer-Assistent error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});