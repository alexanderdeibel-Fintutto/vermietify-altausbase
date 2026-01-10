import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tenant_id, subject, message, attachments = [] } = await req.json();

  // Get or create thread
  let thread = await base44.asServiceRole.entities.MessageThread.filter({
    tenant_id,
    subject
  }).then(t => t[0]);

  if (!thread) {
    // AI categorization and prioritization
    const aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analysiere diese Mieter-Nachricht und kategorisiere sie:
      
Betreff: ${subject}
Nachricht: ${message}

Kategorisiere in: payment (Zahlung), maintenance (Wartung), contract (Vertrag), complaint (Beschwerde), general (Allgemein)
Priorisiere: low, medium, high, urgent
Erstelle eine kurze Zusammenfassung (max 100 Zeichen)`,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          priority: { type: 'string' },
          summary: { type: 'string' }
        }
      }
    });

    thread = await base44.asServiceRole.entities.MessageThread.create({
      tenant_id,
      subject,
      category: aiAnalysis.category || 'general',
      priority: aiAnalysis.priority || 'medium',
      status: 'open',
      last_message_at: new Date().toISOString(),
      unread_count_tenant: 0,
      unread_count_admin: 1,
      ai_summary: aiAnalysis.summary || subject
    });
  } else {
    // Update thread
    await base44.asServiceRole.entities.MessageThread.update(thread.id, {
      last_message_at: new Date().toISOString(),
      unread_count_admin: (thread.unread_count_admin || 0) + 1
    });
  }

  // Create message
  const newMessage = await base44.asServiceRole.entities.TenantMessage.create({
    thread_id: thread.id,
    tenant_id,
    tenant_email: user.email,
    sender_name: user.full_name,
    message,
    direction: 'from_tenant',
    attachments,
    is_read: false
  });

  // Send push notifications to admins
  const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
  
  for (const admin of admins) {
    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: admin.email,
      title: `Neue Mieter-Nachricht: ${subject}`,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      type: 'message',
      priority: thread.priority,
      related_entity_type: 'message_thread',
      related_entity_id: thread.id
    });

    // Send email notification for high/urgent priority
    if (['high', 'urgent'].includes(thread.priority)) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `🔔 Dringende Mieter-Nachricht: ${subject}`,
        body: `Neue Nachricht von ${user.full_name}

Betreff: ${subject}
Priorität: ${thread.priority}
Kategorie: ${thread.category}

Nachricht:
${message}

Bitte antworten Sie im Admin-Portal.`
      });
    }
  }

  return Response.json({ 
    success: true,
    thread_id: thread.id,
    message_id: newMessage.id,
    category: thread.category,
    priority: thread.priority
  });
});