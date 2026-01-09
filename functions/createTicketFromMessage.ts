import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message_id, tenant_id, tenant_email, message_text, source = 'message' } = await req.json();

    if (!tenant_id || !message_text) {
      return Response.json({ error: 'tenant_id and message_text required' }, { status: 400 });
    }

    // Use AI to analyze message and extract ticket details
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analysiere diese Mieteranfrage und extrahiere Ticket-Informationen auf Deutsch.

Nachricht: ${message_text}

Gib zurück im JSON-Format:
- subject: Kurzer prägnanter Betreff (max 60 Zeichen)
- category: Eine von [maintenance, financial, contract, complaint, question, other]
- priority: Eine von [low, medium, high, urgent]
- description: Zusammenfassung der Anfrage`,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          category: { type: "string" },
          priority: { type: "string" },
          description: { type: "string" }
        }
      }
    });

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;

    // Create ticket
    const ticket = await base44.asServiceRole.entities.SupportTicket.create({
      ticket_number: ticketNumber,
      tenant_id,
      tenant_email,
      subject: analysis.subject,
      description: analysis.description,
      category: analysis.category,
      priority: analysis.priority,
      status: 'open',
      source,
      related_message_id: message_id,
      created_at: new Date().toISOString()
    });

    // Notify admins
    const admins = await base44.asServiceRole.entities.User.list();
    const adminEmails = admins.filter(u => u.role === 'admin').map(u => u.email);

    for (const adminEmail of adminEmails) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: adminEmail,
        title: 'Neues Support-Ticket',
        message: `${ticketNumber}: ${analysis.subject}`,
        type: 'support_ticket',
        priority: analysis.priority === 'urgent' ? 'high' : 'normal',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      ticket_number: ticketNumber,
      ticket_id: ticket.id,
      category: analysis.category,
      priority: analysis.priority
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});