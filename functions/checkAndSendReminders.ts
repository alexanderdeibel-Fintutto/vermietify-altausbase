import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all tasks
    const tasks = await base44.asServiceRole.entities.DocumentTask.list();
    const now = new Date();
    let remindersSent = 0;

    for (const task of tasks) {
      if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') {
        continue;
      }

      const dueDate = new Date(task.due_date);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

      // Check for overdue tasks
      if (daysUntilDue < 0 && !task.is_overdue) {
        await base44.asServiceRole.entities.DocumentTask.update(task.id, {
          is_overdue: true
        });

        await base44.functions.invoke('sendNotification', {
          recipient_email: task.assigned_to,
          title: `⚠️ Aufgabe überfällig: ${task.title}`,
          message: `Die Aufgabe "${task.title}" war fällig am ${dueDate.toLocaleDateString('de-DE')}. Bitte priorisieren Sie diese Aufgabe.`,
          notification_type: 'task_overdue',
          related_entity_type: 'task',
          related_entity_id: task.id,
          priority: 'urgent'
        });

        remindersSent++;
      }
      // Check for tasks due in 1 day
      else if (daysUntilDue === 1) {
        await base44.functions.invoke('sendNotification', {
          recipient_email: task.assigned_to,
          title: `📅 Aufgabe fällig morgen: ${task.title}`,
          message: `Die Aufgabe "${task.title}" ist morgen (${dueDate.toLocaleDateString('de-DE')}) fällig.`,
          notification_type: 'task_due',
          related_entity_type: 'task',
          related_entity_id: task.id,
          priority: 'high'
        });

        remindersSent++;
      }
      // Check for tasks due in 3 days
      else if (daysUntilDue === 3) {
        await base44.functions.invoke('sendNotification', {
          recipient_email: task.assigned_to,
          title: `📋 Erinnerung: ${task.title}`,
          message: `Die Aufgabe "${task.title}" ist in 3 Tagen fällig.`,
          notification_type: 'task_due',
          related_entity_type: 'task',
          related_entity_id: task.id,
          priority: 'medium'
        });

        remindersSent++;
      }
    }

    console.log(`Sent ${remindersSent} reminders`);
    return Response.json({ success: true, reminders_sent: remindersSent });
  } catch (error) {
    console.error('Check reminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});