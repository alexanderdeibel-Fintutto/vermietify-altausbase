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
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages = [], conversationHistory = [] } = await req.json();

    const fullHistory = [
      ...conversationHistory,
      ...messages
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
        max_tokens: 1500,
        system: STEUER_ASSISTENT_PROMPT,
        messages: fullHistory
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      return Response.json({ error: result.error?.message || "API error" }, { status: 400 });
    }

    const antwort = result.content[0]?.text || "";

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "steuer_assistent",
      model: "claude-3-5-sonnet-20241022",
      tokens_used: result.usage.output_tokens + result.usage.input_tokens,
      cost_eur: ((result.usage.input_tokens * 0.003 + result.usage.output_tokens * 0.015) / 1000).toFixed(4)
    });

    return Response.json({
      antwort,
      updatedHistory: [
        ...fullHistory,
        { role: "assistant", content: antwort }
      ],
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