import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { thread_id, message, attachments = [] } = await req.json();

  // Get thread
  const thread = await base44.asServiceRole.entities.MessageThread.filter({
    id: thread_id
  }).then(t => t[0]);

  if (!thread) {
    return Response.json({ error: 'Thread not found' }, { status: 404 });
  }

  // Create reply message
  const newMessage = await base44.asServiceRole.entities.TenantMessage.create({
    thread_id,
    tenant_id: thread.tenant_id,
    sender_name: user.full_name,
    message,
    direction: 'to_tenant',
    attachments,
    is_read: false
  });

  // Update thread
  await base44.asServiceRole.entities.MessageThread.update(thread_id, {
    last_message_at: new Date().toISOString(),
    unread_count_tenant: (thread.unread_count_tenant || 0) + 1,
    unread_count_admin: 0
  });

  // Get tenant
  const tenant = await base44.asServiceRole.entities.Tenant.filter({
    id: thread.tenant_id
  }).then(t => t[0]);

  if (tenant?.email) {
    // Send notification to tenant
    await base44.asServiceRole.entities.Notification.create({
      user_email: tenant.email,
      title: `Neue Antwort: ${thread.subject}`,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      type: 'message',
      priority: 'normal',
      related_entity_type: 'message_thread',
      related_entity_id: thread_id
    });

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: tenant.email,
      subject: `Neue Nachricht von Ihrer Hausverwaltung: ${thread.subject}`,
      body: `Hallo ${tenant.first_name},

Sie haben eine neue Nachricht von Ihrer Hausverwaltung erhalten.

Betreff: ${thread.subject}

${message}

Bitte melden Sie sich im Mieterportal an, um zu antworten.

Mit freundlichen Grüßen
Ihre Hausverwaltung`
    });
  }

  return Response.json({ 
    success: true,
    message_id: newMessage.id
  });
});