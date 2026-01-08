import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[REMINDERS] Checking deadlines');

    const currentYear = new Date().getFullYear();
    const deadlines = [
      { form: 'ANLAGE_V', date: new Date(currentYear + 1, 6, 31), days_before: 30 },
      { form: 'EUER', date: new Date(currentYear + 1, 6, 31), days_before: 30 },
      { form: 'UMSATZSTEUER', date: new Date(currentYear + 1, 0, 31), days_before: 14 }
    ];

    const today = new Date();
    let sent = 0;

    for (const deadline of deadlines) {
      const daysUntil = Math.ceil((deadline.date - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil === deadline.days_before || daysUntil === 7 || daysUntil === 1) {
        const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
          tax_form_type: deadline.form,
          tax_year: currentYear,
          status: { $in: ['DRAFT', 'AI_PROCESSED', 'VALIDATED'] }
        });

        if (submissions.length > 0) {
          const users = new Set(submissions.map(s => s.created_by).filter(Boolean));

          for (const userEmail of users) {
            await base44.integrations.Core.SendEmail({
              to: userEmail,
              subject: `ELSTER Erinnerung: ${deadline.form} - noch ${daysUntil} Tage`,
              body: `
                <h2>Deadline-Erinnerung</h2>
                <p>Die Abgabefrist für ${deadline.form} ${currentYear} endet in <strong>${daysUntil} Tagen</strong>.</p>
                <p>Deadline: ${deadline.date.toLocaleDateString('de-DE')}</p>
                <p>Sie haben noch ${submissions.length} offene Submission(s).</p>
              `
            });
            sent++;
          }
        }
      }
    }

    console.log(`[REMINDERS] Sent ${sent} reminders`);

    return Response.json({ success: true, sent });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});