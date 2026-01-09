import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sends notifications when tenant communication is sent
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { communicationId, title, recipientEmails } = await req.json();

    if (!communicationId || !recipientEmails) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Triggering communication notifications for ${recipientEmails.length} recipients`);

    let notificationCount = 0;

    for (const email of recipientEmails) {
      try {
        // Try to find user
        const users = await base44.asServiceRole.entities.User.filter({ email }, null, 1);
        const user = users[0];

        if (!user) {
          console.log(`User ${email} not found, skipping notification`);
          continue;
        }

        const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({ user_id: user.id }, null, 1);
        const preference = prefs[0];

        if (preference && !preference.notify_tenant_communication) {
          continue;
        }

        const notification = await base44.asServiceRole.entities.Notification.create({
          user_id: user.id,
          user_email: email,
          title: '💬 Neue Mitteilung von der Verwaltung',
          message: title,
          notification_type: 'tenant_communication',
          priority: 'normal',
          action_type: 'communication',
          action_target_id: communicationId,
          related_entity_type: 'communication',
          related_entity_id: communicationId,
          metadata: {
            communication_title: title
          }
        });

        notificationCount++;
      } catch (err) {
        console.error(`Failed to create notification for ${email}: ${err.message}`);
      }
    }

    console.log(`Communication notifications created: ${notificationCount}`);

    return Response.json({
      success: true,
      notification_count: notificationCount
    });
  } catch (error) {
    console.error('Error triggering communication notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});