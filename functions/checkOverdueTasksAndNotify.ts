import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Checks for overdue tasks and sends notifications
 * Should be run as a scheduled task (e.g., daily)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Checking for overdue tasks...');

    // Fetch all open/in-progress tasks
    const tasks = await base44.asServiceRole.entities.MaintenanceTask.filter({}, '-due_date', 500);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let notificationCount = 0;
    const overdueByUser = {};

    for (const task of tasks) {
      // Skip completed/cancelled tasks
      if (['completed', 'cancelled'].includes(task.status)) {
        continue;
      }

      // Check if due date is in the past
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate >= today) {
        continue; // Not overdue
      }

      // Get assigned user
      const assignedTo = task.assigned_to;
      if (!assignedTo) {
        continue;
      }

      // Accumulate overdue tasks per user
      if (!overdueByUser[assignedTo]) {
        overdueByUser[assignedTo] = [];
      }
      overdueByUser[assignedTo].push(task);
    }

    // Send notifications for each user with overdue tasks
    for (const [userEmail, userTasks] of Object.entries(overdueByUser)) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail }, null, 1);
        const user = users[0];

        if (!user) {
          continue;
        }

        const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({ user_id: user.id }, null, 1);
        const preference = prefs[0];

        if (preference && !preference.notify_overdue_tasks) {
          continue;
        }

        const taskCount = userTasks.length;
        const notification = await base44.asServiceRole.entities.Notification.create({
          user_id: user.id,
          user_email: userEmail,
          title: '⏰ Überfällige Aufgaben',
          message: `Sie haben ${taskCount} überfällige Wartungsaufgabe(n).`,
          notification_type: 'task_overdue',
          priority: 'high',
          metadata: {
            overdue_count: taskCount,
            task_ids: userTasks.map(t => t.id)
          }
        });

        notificationCount++;

        // Send email if enabled
        if (preference && preference.email_notifications_enabled) {
          try {
            await base44.integrations.Core.SendEmail({
              to: userEmail,
              subject: `⏰ Sie haben ${taskCount} überfällige Aufgabe(n)`,
              body: `Hallo,\n\nSie haben folgende überfällige Aufgaben:\n\n${userTasks.map(t => `- ${t.title} (fällig am ${t.due_date})`).join('\n')}\n\nBitte kümmern Sie sich um diese Aufgaben.\n\nMit freundlichen Grüßen\nIhres Verwaltungssystem`
            });
          } catch (err) {
            console.error(`Failed to send email to ${userEmail}`);
          }
        }
      } catch (err) {
        console.error(`Failed to process overdue notification for ${userEmail}: ${err.message}`);
      }
    }

    console.log(`Checked overdue tasks. Sent ${notificationCount} notifications.`);

    return Response.json({
      success: true,
      notification_count: notificationCount,
      users_with_overdue: Object.keys(overdueByUser).length
    });
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});