import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[DEADLINE-NOTIFY] Checking deadlines');

    const year = new Date().getFullYear();
    const today = new Date();

    const deadlines = [
      { name: 'Anlage V', date: new Date(year, 6, 31), form_type: 'ANLAGE_V' }, // 31. Juli
      { name: 'EÜR', date: new Date(year, 6, 31), form_type: 'EUER' },
      { name: 'Gewerbesteuer', date: new Date(year, 6, 31), form_type: 'GEWERBESTEUER' }
    ];

    const notifications = [];

    for (const deadline of deadlines) {
      const daysUntil = Math.ceil((deadline.date - today) / (1000 * 60 * 60 * 24));

      if (daysUntil > 0 && daysUntil <= 30) {
        // Prüfe offene Submissions
        const openSubs = await base44.asServiceRole.entities.ElsterSubmission.filter({
          tax_form_type: deadline.form_type,
          status: { $in: ['DRAFT', 'AI_PROCESSED'] }
        });

        if (openSubs.length > 0) {
          const users = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
          
          for (const user of users) {
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: `ELSTER Deadline Reminder: ${deadline.name}`,
              body: `
                <h2>Deadline-Erinnerung</h2>
                <p><strong>${deadline.name}</strong> Abgabefrist: ${deadline.date.toLocaleDateString('de-DE')}</p>
                <p>Noch ${daysUntil} Tage</p>
                <p>${openSubs.length} offene Submissions benötigen Ihre Aufmerksamkeit.</p>
              `
            });

            notifications.push({ user: user.email, deadline: deadline.name, days_until: daysUntil });
          }
        }
      }
    }

    return Response.json({ success: true, notifications_sent: notifications.length, notifications });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});