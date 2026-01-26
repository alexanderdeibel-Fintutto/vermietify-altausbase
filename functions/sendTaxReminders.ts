import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('Sending tax deadline reminders...');

    const deadlines = await base44.entities.TaxDeadline.filter(
      { is_active: true },
      '-deadline_date',
      100
    ) || [];

    const now = new Date();
    let remindersSent = 0;

    for (const deadline of deadlines) {
      const deadlineDate = new Date(deadline.deadline_date);
      const daysUntil = Math.floor((deadlineDate - now) / (1000 * 60 * 60 * 24));

      // Send reminder if within reminder_days_before and not yet sent
      if (daysUntil <= deadline.reminder_days_before && daysUntil > 0 && !deadline.reminder_sent) {
        try {
          // Get users with this country
          const allUsers = await base44.entities.User.list('-created_date', 1000) || [];
          const relevantUsers = allUsers.filter(u => {
            return u.preferred_countries?.includes(deadline.country) || !u.preferred_countries;
          });

          // Send email to each user
          for (const u of relevantUsers) {
            if (u.email && u.email !== 'system@base44.io') {
              await base44.integrations.Core.SendEmail({
                to: u.email,
                subject: `⏰ Steuerfrist: ${deadline.title} in ${daysUntil} Tagen`,
                body: `
                  <h2>${deadline.title}</h2>
                  <p><strong>Fällig am:</strong> ${new Date(deadline.deadline_date).toLocaleDateString('de-DE')}</p>
                  <p><strong>Tage verbleibend:</strong> ${daysUntil}</p>
                  <p><strong>Priorität:</strong> ${deadline.priority}</p>
                  <p>${deadline.description}</p>
                  <p><a href="https://app.base44.de/pages/TaxManagement">Zur Steuerverwaltung</a></p>
                `
              });
            }
          }

          // Mark reminder as sent
          await base44.asServiceRole.entities.TaxDeadline.update(deadline.id, {
            reminder_sent: true
          });

          remindersSent++;
          console.log(`Reminder sent for: ${deadline.title}`);
        } catch (error) {
          console.error(`Error sending reminder for ${deadline.title}:`, error);
        }
      }
    }

    return Response.json({
      success: true,
      remindersSent,
      processed: deadlines.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});