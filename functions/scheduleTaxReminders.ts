import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch deadlines and compliance items
    const [deadlines, compliance] = await Promise.all([
      base44.entities.TaxDeadline.filter({ country }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => [])
    ]);

    const reminders = [];
    const today = new Date();

    for (const deadline of deadlines) {
      const deadlineDate = new Date(deadline.deadline_date);
      
      // Only schedule for current/future years
      if (deadlineDate.getFullYear() < today.getFullYear()) continue;

      // Create reminders at different intervals
      const reminderDays = deadline.days_before_reminder || [30, 14, 7, 3, 1];

      for (const daysOffset of reminderDays) {
        const reminderDate = new Date(deadlineDate);
        reminderDate.setDate(reminderDate.getDate() - daysOffset);

        // Only create future reminders
        if (reminderDate > today) {
          reminders.push({
            user_email: user.email,
            country,
            tax_year: taxYear,
            reminder_type: `deadline_${daysOffset}_${daysOffset === 1 ? 'day' : 'days'}`,
            title: `${daysOffset === 1 ? 'Morgen' : 'In ' + daysOffset + ' Tagen'}: ${deadline.title}`,
            message: `Bitte denken Sie an die Einreichung von ${deadline.title}. Fällig: ${deadlineDate.toLocaleDateString('de-DE')}`,
            scheduled_date: reminderDate.toISOString().split('T')[0],
            related_deadline: deadlineDate.toISOString().split('T')[0],
            notification_channels: ['email', 'in_app'],
            status: 'pending'
          });
        }
      }
    }

    // Bulk create reminders
    if (reminders.length > 0) {
      await base44.entities.TaxReminder.bulkCreate(reminders).catch(() => {});
    }

    return Response.json({
      status: 'success',
      scheduled_reminders: reminders.length,
      reminders: reminders.slice(0, 5) // Return first 5 as preview
    });
  } catch (error) {
    console.error('Schedule tax reminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});