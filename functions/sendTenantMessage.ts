import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sends a message from tenant or admin
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      conversationId,
      tenantId,
      unitId,
      buildingId,
      subject,
      content,
      messageType = 'message',
      priority = 'normal',
      attachments = []
    } = await req.json();

    if (!conversationId || !tenantId || !content) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`Sending message in conversation ${conversationId}`);

    // Determine sender type
    const senderType = user.role === 'admin' ? 'admin' : 'tenant';

    // Create message
    const message = await base44.entities.TenantMessage.create({
      conversation_id: conversationId,
      tenant_id: tenantId,
      unit_id: unitId || null,
      building_id: buildingId || null,
      sender_type: senderType,
      sender_email: user.email,
      sender_name: user.full_name,
      subject: subject || '',
      content,
      message_type: messageType,
      priority,
      attachments,
      is_read: false
    });

    console.log(`Message created: ${message.id}`);

    // Get recipient
    let recipientEmail = '';
    let recipientName = '';

    if (senderType === 'admin') {
      // Admin sending to tenant
      const tenant = await base44.entities.Tenant.filter({ id: tenantId }, null, 1);
      if (tenant[0]) {
        recipientEmail = tenant[0].email;
        recipientName = tenant[0].full_name;
      }
    } else {
      // Tenant sending to admin - notify all admins
      const allUsers = await base44.asServiceRole.entities.User.list('-updated_date', 100);
      const admins = allUsers.filter(u => u.role === 'admin');

      for (const admin of admins) {
        try {
          await base44.entities.Notification.create({
            user_id: admin.id,
            user_email: admin.email,
            title: '💬 Neue Mieter-Nachricht',
            message: `${user.full_name} hat eine ${messageType === 'maintenance_request' ? 'Wartungsanfrage' : 'Nachricht'} gesendet: "${subject || content.substring(0, 50)}"`,
            notification_type: 'tenant_communication',
            priority: priority,
            action_type: 'communication',
            action_target_id: message.id,
            related_entity_type: 'communication',
            related_entity_id: message.id
          });
        } catch (err) {
          console.error(`Failed to notify admin ${admin.email}`);
        }
      }
    }

    // Send notification to recipient
    if (senderType === 'admin' && recipientEmail) {
      try {
        const tenant = await base44.entities.Tenant.filter({ id: tenantId }, null, 1);
        if (tenant[0]) {
          const tenantUser = await base44.asServiceRole.entities.User.filter(
            { email: recipientEmail },
            null,
            1
          );

          if (tenantUser[0]) {
            await base44.entities.Notification.create({
              user_id: tenantUser[0].id,
              user_email: recipientEmail,
              title: '💬 Neue Nachricht von der Verwaltung',
              message: subject || content.substring(0, 100),
              notification_type: 'tenant_communication',
              priority: 'normal',
              action_type: 'communication',
              action_target_id: message.id
            });
          }
        }
      } catch (err) {
        console.error(`Failed to send notification to tenant`);
      }
    }

    return Response.json({
      success: true,
      message_id: message.id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});