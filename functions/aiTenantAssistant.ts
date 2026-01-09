import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, tenantContext, conversationHistory } = await req.json();

    if (!message) {
      return Response.json({ error: 'Missing message' }, { status: 400 });
    }

    const systemPrompt = `Du bist ein hilfreicher AI-Assistent für ein Immobilienverwaltungssystem. 
Du antwortest auf Fragen von Mietern zu ihren Mietverträgen, Zahlungen, Wartungsanfragen und allgemeinen Fragen.

Kontext des Mieters:
- Name: ${tenantContext?.tenant?.first_name} ${tenantContext?.tenant?.last_name}
- Miete: €${tenantContext?.activeContract?.monthly_rent}
- Vertragsstart: ${tenantContext?.activeContract?.start_date}
- Ausstehende Rechnungen: ${tenantContext?.recentInvoices?.filter(i => i.status !== 'paid').length || 0}

Antworte kurz, hilfreich und freundlich auf Deutsch. Wenn die Frage außerhalb deines Kompetenzbreichs liegt, schlage vor, den Administrator zu kontaktieren.`;

    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Mieter' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\nGesprächsverlauf:\n${conversationContext}\n\nNeue Frage: ${message}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
    });

    return Response.json({
      response: response,
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});