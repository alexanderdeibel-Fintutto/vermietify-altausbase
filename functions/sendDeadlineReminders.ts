import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[DEADLINE REMINDERS] Starting check');

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Definiere Fristen
    const deadlines = [
      { month: 2, day: 28, name: 'Gewerbesteuer Vorauszahlung Q1', forms: ['GEWERBESTEUER'] },
      { month: 5, day: 10, name: 'Umsatzsteuer Voranmeldung Q1', forms: ['UMSATZSTEUER'] },
      { month: 5, day: 31, name: 'Gewerbesteuer Vorauszahlung Q2', forms: ['GEWERBESTEUER'] },
      { month: 7, day: 31, name: 'Einkommensteuererklärung', forms: ['ANLAGE_V', 'EUER', 'EST1B'] },
      { month: 8, day: 10, name: 'Umsatzsteuer Voranmeldung Q2', forms: ['UMSATZSTEUER'] },
      { month: 8, day: 31, name: 'Gewerbesteuer Vorauszahlung Q3', forms: ['GEWERBESTEUER'] },
      { month: 11, day: 10, name: 'Umsatzsteuer Voranmeldung Q3', forms: ['UMSATZSTEUER'] },
      { month: 11, day: 30, name: 'Gewerbesteuer Vorauszahlung Q4', forms: ['GEWERBESTEUER'] }
    ];

    // Finde anstehende Fristen (nächste 30 Tage)
    const upcomingDeadlines = deadlines.filter(d => {
      const deadlineDate = new Date(currentYear, d.month - 1, d.day);
      const now = new Date();
      const daysUntil = Math.floor((deadlineDate - now) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    });

    console.log(`[INFO] Found ${upcomingDeadlines.length} upcoming deadlines`);

    const notifications = [];

    for (const deadline of upcomingDeadlines) {
      const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
      const daysUntil = Math.floor((deadlineDate - deadlineDate) / (1000 * 60 * 60 * 24));

      // Prüfe für jede betroffene Formular-Art
      for (const formType of deadline.forms) {
        const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
          tax_form_type: formType,
          tax_year: currentYear,
          status: { $in: ['DRAFT', 'AI_PROCESSED', 'VALIDATED'] }
        });

        if (submissions.length > 0) {
          // Erstelle Benachrichtigung für jeden User mit offenen Submissions
          const userIds = [...new Set(submissions.map(s => s.created_by))];

          for (const userId of userIds) {
            try {
              await base44.asServiceRole.functions.invoke('createNotification', {
                user_id: userId,
                type: 'deadline_reminder',
                title: `Frist läuft ab: ${deadline.name}`,
                message: `In ${daysUntil} Tagen (${deadlineDate.toLocaleDateString('de-DE')}). Sie haben noch ${submissions.filter(s => s.created_by === userId).length} offene ${formType} Submissions.`,
                priority: daysUntil <= 7 ? 'high' : 'medium',
                link: '/ElsterIntegration',
                metadata: {
                  deadline_date: deadlineDate.toISOString(),
                  form_type: formType,
                  days_until: daysUntil
                }
              });

              notifications.push({
                user_id: userId,
                deadline: deadline.name,
                days_until: daysUntil,
                form_type: formType
              });

              console.log(`[SENT] Notification to user ${userId} for ${formType}`);
            } catch (error) {
              console.error(`[ERROR] Failed to notify ${userId}:`, error.message);
            }
          }
        }
      }
    }

    console.log(`[SUCCESS] Sent ${notifications.length} deadline reminders`);

    return Response.json({
      success: true,
      notifications_sent: notifications.length,
      upcoming_deadlines: upcomingDeadlines.length,
      notifications
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});