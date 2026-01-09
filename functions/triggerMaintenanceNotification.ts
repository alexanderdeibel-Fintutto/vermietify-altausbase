import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sends a notification when a maintenance task is assigned
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taskId, assignedToEmail, taskTitle, buildingName } = await req.json();

    if (!taskId || !assignedToEmail) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Triggering maintenance notification for task ${taskId}`);

    // Get user preferences
    const users = await base44.asServiceRole.entities.User.filter({ email: assignedToEmail }, null, 1);
    const user = users[0];

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({ user_id: user.id }, null, 1);
    const preference = prefs[0];

    // Check if user wants these notifications
    if (preference && !preference.notify_maintenance_assigned) {
      console.log(`User ${assignedToEmail} has disabled maintenance notifications`);
      return Response.json({ success: true, skipped: true });
    }

    // Create notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id: user.id,
      user_email: assignedToEmail,
      title: '🔧 Neue Wartungsaufgabe zugewiesen',
      message: `${taskTitle} wurde Ihnen für ${buildingName} zugewiesen.`,
      notification_type: 'maintenance_assigned',
      priority: 'high',
      action_type: 'maintenance_task',
      action_target_id: taskId,
      related_entity_type: 'maintenance_task',
      related_entity_id: taskId,
      metadata: {
        task_title: taskTitle,
        building_name: buildingName
      }
    });

    console.log(`Maintenance notification created: ${notification.id}`);

    // Send email if enabled
    if (preference && preference.email_notifications_enabled) {
      try {
        await base44.integrations.Core.SendEmail({
          to: assignedToEmail,
          subject: '🔧 Neue Wartungsaufgabe zugewiesen',
          body: `Hallo,\n\nIhnen wurde eine neue Wartungsaufgabe zugewiesen:\n\n${taskTitle}\nGebäude: ${buildingName}\n\nBitte kümmern Sie sich um diese Aufgabe.\n\nMit freundlichen Grüßen\nIhres Verwaltungssystem`
        });
        console.log(`Email sent to ${assignedToEmail}`);
      } catch (err) {
        console.error(`Failed to send email: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      notification_id: notification.id
    });
  } catch (error) {
    console.error('Error triggering maintenance notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});