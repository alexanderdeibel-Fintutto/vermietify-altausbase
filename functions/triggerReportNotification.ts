import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sends notifications when a report is generated
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { reportId, reportName, generatedBy } = await req.json();

    if (!reportId || !reportName) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Triggering report notification for ${reportName}`);

    // Get all admins
    const allUsers = await base44.asServiceRole.entities.User.list('-updated_date', 100);
    const admins = allUsers.filter(u => u.role === 'admin');

    let notificationCount = 0;

    for (const admin of admins) {
      try {
        const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({ user_id: admin.id }, null, 1);
        const preference = prefs[0];

        if (preference && !preference.notify_reports) {
          continue;
        }

        const notification = await base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          user_email: admin.email,
          title: '📊 Bericht generiert',
          message: `Der Bericht "${reportName}" wurde erfolgreich generiert.`,
          notification_type: 'report_generated',
          priority: 'normal',
          action_type: 'report',
          action_target_id: reportId,
          related_entity_type: 'report',
          related_entity_id: reportId,
          metadata: {
            report_name: reportName,
            generated_by: generatedBy
          }
        });

        notificationCount++;
      } catch (err) {
        console.error(`Failed to create notification for admin ${admin.email}: ${err.message}`);
      }
    }

    console.log(`Report notifications created: ${notificationCount}`);

    return Response.json({
      success: true,
      notification_count: notificationCount
    });
  } catch (error) {
    console.error('Error triggering report notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});