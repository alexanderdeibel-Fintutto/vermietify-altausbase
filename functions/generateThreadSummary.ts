import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tenant_id } = await req.json();

    if (!tenant_id) {
      return Response.json({ error: 'Missing tenant_id' }, { status: 400 });
    }

    // Fetch all messages for this tenant
    const messages = await base44.asServiceRole.entities.TenantMessage.filter(
      { tenant_id },
      '-created_at',
      100
    );

    if (messages.length === 0) {
      return Response.json({ 
        success: false,
        error: 'No messages to summarize'
      }, { status: 400 });
    }

    // Format messages for AI
    const conversationText = messages.map(msg => {
      const timestamp = new Date(msg.created_at).toLocaleString('de-DE');
      const sender = msg.sender_type === 'tenant' ? 'Mieter' : 'Verwaltung';
      return `[${timestamp}] ${sender}: ${msg.message_text}`;
    }).join('\n\n');

    // Generate summary using AI
    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Erstelle eine prägnante Zusammenfassung der folgenden Konversation zwischen einem Mieter und der Verwaltung. 
Fokussiere auf:
- Hauptthemen der Konversation
- Wichtige Anliegen oder Probleme
- Getroffene Vereinbarungen oder nächste Schritte
- Offene Punkte

Konversation:
${conversationText}

Erstelle eine gut strukturierte Zusammenfassung auf Deutsch in 3-5 Absätzen.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          key_topics: { type: 'array', items: { type: 'string' } },
          action_items: { type: 'array', items: { type: 'string' } },
          open_issues: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      success: true,
      summary: response.summary,
      key_topics: response.key_topics,
      action_items: response.action_items,
      open_issues: response.open_issues,
      message_count: messages.length
    });
  } catch (error) {
    console.error('Error generating thread summary:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});