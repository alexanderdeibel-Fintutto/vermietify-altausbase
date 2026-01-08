import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[NOTIFICATION] Checking for status changes');

    // Hole alle Submissions der letzten 24h mit Status-Änderungen
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentActivity = await base44.asServiceRole.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission',
      action: { $in: ['status_changed', 'submitted', 'validated'] },
      created_date: { $gte: yesterday.toISOString() }
    });

    if (recentActivity.length === 0) {
      console.log('[NOTIFICATION] No recent changes');
      return Response.json({ success: true, sent: 0 });
    }

    // Gruppiere nach User
    const userNotifications = {};
    
    for (const activity of recentActivity) {
      const userEmail = activity.performed_by || activity.created_by;
      if (!userEmail) continue;

      if (!userNotifications[userEmail]) {
        userNotifications[userEmail] = [];
      }

      userNotifications[userEmail].push({
        submission_id: activity.entity_id,
        action: activity.action,
        date: activity.created_date
      });
    }

    let sent = 0;

    // Sende Benachrichtigungen
    for (const [email, activities] of Object.entries(userNotifications)) {
      try {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `ELSTER Update: ${activities.length} Änderungen`,
          body: `
            <h2>ELSTER Status-Updates</h2>
            <p>Folgende Änderungen wurden in den letzten 24 Stunden vorgenommen:</p>
            <ul>
              ${activities.map(a => `<li>${a.action} - ${new Date(a.date).toLocaleString('de-DE')}</li>`).join('')}
            </ul>
          `
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error);
      }
    }

    console.log(`[NOTIFICATION] Sent ${sent} notifications`);

    return Response.json({
      success: true,
      sent
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});