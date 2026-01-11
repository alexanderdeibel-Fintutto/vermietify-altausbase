import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { tenant_ids, type, title, message, priority = 'normal', related_document_id } = await req.json();

    if (!tenant_ids || !type || !title || !message) {
      return Response.json({
        error: 'Missing required fields: tenant_ids, type, title, message'
      }, { status: 400 });
    }

    const notifications = [];

    // Erstelle Benachrichtigungen für jeden Mieter
    for (const tenantId of tenant_ids) {
      const notification = await base44.asServiceRole.entities.TenantNotification.create({
        tenant_id: tenantId,
        type,
        title,
        message,
        priority,
        related_document_id,
        is_read: false
      });
      notifications.push(notification);
    }

    // Versende optional Slack-Benachrichtigung an Admin
    try {
      const tenantCount = tenant_ids.length;
      await base44.integrations.Slack.PostMessage({
        channel: '#admin-notifications',
        text: `📢 Benachrichtigung an ${tenantCount} Mieter(n) versendet: ${title}`
      });
    } catch (error) {
      console.error('Slack notification failed:', error);
    }

    return Response.json({
      success: true,
      message: `Benachrichtigungen an ${notifications.length} Mieter(n) versendet`,
      notificationIds: notifications.map(n => n.id)
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});