import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users with batch enabled
    const prefs = await base44.asServiceRole.entities.AlertPreference?.list?.() || [];
    const batchUsers = prefs.filter(p => p.batch_enabled);

    let sent = 0;

    for (const userPref of batchUsers) {
      // Get unsent notifications for this user since last send
      const notifications = await base44.asServiceRole.entities.Notification?.list?.() || [];
      const userNotis = notifications.filter(n => 
        n.recipient_email === userPref.user_email && 
        !n.sent_at &&
        !n.is_read
      );

      if (userNotis.length > 0) {
        try {
          // Send email with batch
          await base44.integrations.Core.SendEmail({
            to: userPref.user_email,
            subject: `${userNotis.length} neue Benachrichtigungen`,
            body: `
              <h2>${userNotis.length} neue Benachrichtigungen</h2>
              <ul>
                ${userNotis.map(n => `
                  <li>
                    <strong>${n.title}</strong><br/>
                    ${n.message}<br/>
                    <em>${new Date(n.created_date).toLocaleString('de-DE')}</em>
                  </li>
                `).join('')}
              </ul>
            `
          });

          // Mark as sent
          for (const noti of userNotis) {
            await base44.asServiceRole.entities.Notification?.update?.(noti.id, {
              sent_at: new Date().toISOString()
            });
          }

          sent++;
        } catch (e) {
          console.error(`Error sending batch to ${userPref.user_email}:`, e);
        }
      }
    }

    return Response.json({
      data: {
        batch_emails_sent: sent,
        total_notifications_batched: batchUsers.length
      }
    });

  } catch (error) {
    console.error('Batch send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});