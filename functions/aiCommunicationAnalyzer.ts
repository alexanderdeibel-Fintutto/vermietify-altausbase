import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action, company_id, question_topic } = await req.json();
    
    if (action === 'summarize_common_queries') {
      const communications = await base44.asServiceRole.entities.TenantCommunication.filter({ 
        company_id 
      }, '-created_date', 100);
      
      const messages = communications
        .map(c => c.message)
        .filter(m => m && m.length > 10)
        .slice(0, 50);
      
      const prompt = `Analysiere diese Mieteranfragen und identifiziere die häufigsten Themen:

${messages.join('\n---\n')}

Erstelle eine Zusammenfassung der TOP 5 häufigsten Anfragekategorien mit:
- Anzahl ähnlicher Anfragen
- Beispiel-Anfrage
- Empfohlene Standardantwort

Antworte mit JSON:
{
  "common_queries": [
    {
      "category": "...",
      "frequency": ...,
      "example_question": "...",
      "suggested_response": "..."
    }
  ],
  "insights": "..."
}`;

      const summary = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            common_queries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  frequency: { type: "number" },
                  example_question: { type: "string" },
                  suggested_response: { type: "string" }
                }
              }
            },
            insights: { type: "string" }
          }
        }
      });
      
      return Response.json({ summary });
    }
    
    if (action === 'draft_response') {
      const prompt = `Verfasse eine professionelle Antwort für eine häufig gestellte Frage:

Thema: ${question_topic}

Die Antwort soll:
- Freundlich und professionell sein
- Klare Informationen liefern
- Auf Deutsch verfasst sein
- 100-150 Wörter lang sein
- Nächste Schritte beschreiben

Gib NUR die fertige Antwort zurück, ohne Einleitung.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      
      return Response.json({ draft_response: response });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});