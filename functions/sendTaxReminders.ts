import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date();
    const allDeadlines = await base44.entities.TaxDeadline.list('-deadline_date', 100) || [];

    const remindersToSend = [];

    for (const deadline of allDeadlines) {
      if (deadline.reminder_sent) continue;

      const deadlineDate = new Date(deadline.deadline_date);
      const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil <= deadline.reminder_days_before && daysUntil > 0) {
        remindersToSend.push(deadline);
      }
    }

    // Send reminders
    for (const deadline of remindersToSend) {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `⏰ Steuererklärung-Erinnerung: ${deadline.title}`,
        body: `
Hallo ${user.full_name},

dieser Erinnerung erinnert Sie an den bevorstehenden Steuertermins:

📌 ${deadline.title} (${deadline.country})
📅 Fälligkeitsdatum: ${deadline.deadline_date}
⏱️ Tage verbleibend: ${Math.floor((new Date(deadline.deadline_date) - new Date()) / (1000 * 60 * 60 * 24))}

${deadline.description}

Priorität: ${deadline.priority.toUpperCase()}

Bitte aktualisieren Sie Ihren Status auf unserer Plattform.

Mit freundlichen Grüßen,
Ihr Steuerverwaltungssystem
        `
      });

      // Mark as reminded
      await base44.entities.TaxDeadline.update(deadline.id, {
        reminder_sent: true
      });
    }

    return Response.json({
      success: true,
      remindersSent: remindersToSend.length,
      details: remindersToSend.map(d => ({
        id: d.id,
        title: d.title,
        country: d.country,
        deadline: d.deadline_date
      }))
    });
  } catch (error) {
    console.error('Reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});