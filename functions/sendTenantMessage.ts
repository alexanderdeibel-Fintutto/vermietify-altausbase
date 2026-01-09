import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tenant_id, sender_email, sender_type, message_text } = await req.json();

    if (!tenant_id || !sender_email || !sender_type || !message_text) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create message
    const message = await base44.asServiceRole.entities.TenantMessage.create({
      tenant_id,
      sender_email,
      sender_type,
      message_text,
      is_read: false,
      created_at: new Date().toISOString()
    });

    // Send notification to recipient
    try {
      if (sender_type === 'tenant') {
        // Notify admins
        await base44.asServiceRole.functions.invoke('createNotification', {
          recipient_type: 'admin',
          notification_type: 'new_message',
          title: 'Neue Nachricht von Mieter',
          message: `${sender_email}: ${message_text.substring(0, 50)}...`,
          related_entity_type: 'tenant_message',
          related_entity_id: message.id
        });
      } else {
        // Notify tenant
        const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id }, null, 1);
        const tenant = tenants[0];
        
        if (tenant?.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: tenant.email,
            subject: 'Neue Nachricht von Ihrer Verwaltung',
            body: `Sie haben eine neue Nachricht erhalten:\n\n${message_text}\n\nBitte melden Sie sich im Mieterportal an, um zu antworten.`,
            from_name: 'Verwaltung'
          });
        }
      }
    } catch (notificationError) {
      console.warn('Failed to send notification:', notificationError);
    }

    return Response.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});