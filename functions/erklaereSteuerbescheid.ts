import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STEUERBESCHEID_PROMPT = `Du bist ein freundlicher Steuerberater, der deutschen Bürgern ihre Steuerbescheide erklärt.

DEINE AUFGABE:
Analysiere den Steuerbescheid und erkläre JEDEN wichtigen Posten in einfacher, verständlicher Sprache.

ANTWORTE IN DIESEM FORMAT:

## 📋 Zusammenfassung
[Kurze Zusammenfassung: Wurde zu viel oder zu wenig gezahlt? Wie viel Erstattung/Nachzahlung?]

## 💰 Die wichtigsten Zahlen

### Zu versteuerndes Einkommen: [Betrag] €
[Erklärung in 1-2 Sätzen]

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
- Erkläre ALLES in einfacher Sprache
- Sei ermutigend und positiv
- Wenn etwas unklar ist, sag das ehrlich
- Sprich den Nutzer mit "du" an`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageBase64, imageMediaType = "image/jpeg" } = await req.json();

    if (!imageBase64) {
      return Response.json({ error: 'imageBase64 erforderlich' }, { status: 400 });
    }

    const content = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType,
          data: imageBase64
        }
      },
      {
        type: "text",
        text: "Bitte analysiere diesen Steuerbescheid und erkläre mir alle wichtigen Posten in einfacher Sprache."
      }
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        system: STEUERBESCHEID_PROMPT,
        messages: [
          {
            role: "user",
            content
          }
        ]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      return Response.json({ error: result.error?.message || "API error" }, { status: 400 });
    }

    const erklaerung = result.content[0]?.text || "";

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "steuerbescheid_erklaerer",
      model: "claude-3-5-sonnet-20241022",
      tokens_used: result.usage.output_tokens + result.usage.input_tokens,
      cost_eur: ((result.usage.input_tokens * 0.003 + result.usage.output_tokens * 0.015) / 1000).toFixed(4)
    });

    return Response.json({
      erklaerung,
      _meta: {
        model: "claude-3-5-sonnet-20241022",
        tokens: result.usage.output_tokens + result.usage.input_tokens,
        costEur: ((result.usage.input_tokens * 0.003 + result.usage.output_tokens * 0.015) / 1000).toFixed(4)
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});