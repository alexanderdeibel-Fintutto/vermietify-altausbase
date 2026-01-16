import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STEUERBESCHEID_PROMPT = `Du bist ein freundlicher Steuerberater, der deutschen Bürgern ihre Steuerbescheide erklärt.

DEINE AUFGABE:
Analysiere den Steuerbescheid und erkläre JEDEN wichtigen Posten in einfacher, verständlicher Sprache.

ANTWORTE IN DIESEM FORMAT:

## 📋 Zusammenfassung
[Kurze Zusammenfassung: Wurde zu viel oder zu wenig gezahlt? Wie viel Erstattung/Nachzahlung?]

## 💰 Die wichtigsten Zahlen

### Zu versteuerndes Einkommen: [Betrag] €
[Erklärung in 1-2 Sätzen, was das bedeutet]

### Festgesetzte Einkommensteuer: [Betrag] €
[Erklärung]

### Bereits gezahlte Steuer: [Betrag] €
[Erklärung]

### Erstattung / Nachzahlung: [Betrag] €
[Erklärung und wann das Geld kommt/fällig ist]

## 🔍 Einzelne Posten erklärt

[Für jeden relevanten Posten:]
### [Name des Postens]
**Betrag:** [X] €
**Was ist das?** [Einfache Erklärung]
**Warum steht das da?** [Kontext]

## ⚠️ Auffälligkeiten
[Gibt es etwas, das der Nutzer prüfen sollte?]

## 💡 Tipps für nächstes Jahr
[2-3 konkrete Tipps, wie der Nutzer Steuern sparen könnte]

WICHTIG:
- Erkläre ALLES in einfacher Sprache, keine Fachbegriffe ohne Erklärung
- Sei ermutigend und positiv
- Wenn etwas unklar ist, sag das ehrlich
- Sprich den Nutzer mit "du" an`;

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
            featureKey: 'steuerbescheid_erklaerer',
            messages: [{
                role: 'user',
                content: 'Bitte analysiere diesen Steuerbescheid und erkläre mir alle wichtigen Posten in einfacher Sprache.'
            }],
            systemPrompt: STEUERBESCHEID_PROMPT,
            imageBase64,
            imageMediaType: imageMediaType || 'image/jpeg'
        });

        if (!result.data.success) {
            throw new Error(result.data.error || 'AI-Aufruf fehlgeschlagen');
        }

        return Response.json({
            success: true,
            erklaerung: result.data.content,
            meta: {
                provider: result.data.provider,
                model: result.data.model,
                costEur: result.data.costEur
            }
        });

    } catch (error) {
        console.error('Steuerbescheid-Erklärer error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});