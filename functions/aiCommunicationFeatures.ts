import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, messageId, tenantId, content, type } = await req.json();

    switch (action) {
      case 'generateResponse': {
        // KI-basierte Antwortvorschläge
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Du bist ein hilfreicher Gebäudeverwaltungs-Assistent. 
          Generiere eine professionelle, freundliche Antwortnachricht auf folgende Mieter-Nachricht:
          
          "${content}"
          
          Die Antwort sollte:
          - Kurz und prägnant sein (max 3 Sätze)
          - Professionell aber freundlich wirken
          - Das Problem lösen oder eine Lösung anbieten`,
          response_json_schema: {
            type: 'object',
            properties: {
              response: { type: 'string' },
              tone: { type: 'string' },
            },
          },
        });

        return Response.json({ success: true, suggestion: response.response });
      }

      case 'prioritizeMessages': {
        // Intelligent priorisierte Nachrichten-Warteschlange
        const messages = await base44.entities.TenantMessage.list('-updated_date', 50);

        const prioritized = await base44.integrations.Core.InvokeLLM({
          prompt: `Analysiere diese Mieter-Nachrichten und ordne sie nach Priorität (1=höchste, 3=niedrigste):
          
          ${messages.map(m => `- ${m.subject} (${m.category}): "${m.message.substring(0, 50)}..."`).join('\n')}
          
          Berücksichtige: Dringlichkeit, Problem-Typ, Häufigkeit ähnlicher Anfragen.
          Gib nur die Nummern zurück.`,
          response_json_schema: {
            type: 'object',
            properties: {
              priorities: {
                type: 'array',
                items: { type: 'object', properties: { id: { type: 'string' }, priority: { type: 'number' } } },
              },
            },
          },
        });

        return Response.json({ success: true, priorities: prioritized.priorities });
      }

      case 'automateResponse': {
        // Automatische Antwort für häufige Anfragen
        if (type === 'payment_reminder') {
          await base44.entities.TenantMessage.update(messageId, {
            status: 'resolved',
            response: 'Vielen Dank für Ihre Zahlung. Diese ist bei uns eingegangen.',
            response_date: new Date().toISOString(),
          });
        } else if (type === 'maintenance_request') {
          await base44.entities.TenantMessage.update(messageId, {
            status: 'in_progress',
            response: 'Vielen Dank für Ihre Anfrage. Wir kümmern uns darum und melden uns zeitnah.',
            response_date: new Date().toISOString(),
          });
        }

        return Response.json({ success: true });
      }

      case 'getSentimentAnalysis': {
        // Sentiment-Analyse von Nachrichten
        const message = await base44.entities.TenantMessage.read(messageId);
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analysiere die Stimmung dieser Mieter-Nachricht auf einer Skala von 1-10 (1=sehr negativ, 10=sehr positiv):
          
          "${message.message}"
          
          Gib auch kurz an: Was ist das Kernproblem?`,
          response_json_schema: {
            type: 'object',
            properties: {
              sentiment: { type: 'number' },
              coreIssue: { type: 'string' },
              requiresUrgentAction: { type: 'boolean' },
            },
          },
        });

        return Response.json({ success: true, analysis });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});