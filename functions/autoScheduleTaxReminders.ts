import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Alle Steuerprofile abrufen
    const profiles = await base44.asServiceRole.entities.TaxProfile.list();

    for (const profile of profiles) {
      // Deadlines für dieses Profil
      const deadlines = await base44.asServiceRole.entities.TaxDeadline.filter({
        country: { $in: profile.tax_jurisdictions }
      });

      for (const deadline of deadlines) {
        const today = new Date();
        const deadlineDate = new Date(deadline.deadline_date);
        const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));

        // Reminder-Tage: 30, 14, 7, 3, 1 Tage vor Deadline
        const reminderDays = deadline.days_before_reminder || [30, 14, 7, 3, 1];

        for (const days of reminderDays) {
          if (daysUntil === days) {
            // Reminder erstellen
            await base44.asServiceRole.entities.TaxReminder.create({
              user_email: profile.user_email,
              country: deadline.country,
              tax_year: new Date().getFullYear(),
              reminder_type: daysUntil <= 3 ? 'deadline_1_day' : 'deadline_3_days',
              title: `${daysUntil} Tage bis: ${deadline.title}`,
              message: `${deadline.description}\n\nFrist: ${deadline.deadline_date}`,
              scheduled_date: today.toISOString().split('T')[0],
              related_deadline: deadline.deadline_date,
              status: 'pending'
            });
          }
        }
      }
    }

    return Response.json({
      processed_profiles: profiles.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});