import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[REMINDERS] Checking for upcoming ELSTER deadlines');

    // Steuerfristen für das aktuelle Jahr
    const currentYear = new Date().getFullYear();
    const deadlines = [
      { form: 'UMSATZSTEUER', month: 1, day: 10, description: 'Umsatzsteuer-Voranmeldung Dezember' },
      { form: 'ANLAGE_V', month: 7, day: 31, description: 'Einkommensteuererklärung (ohne Steuerberater)' },
      { form: 'ANLAGE_V', month: 2, day: 28, description: 'Einkommensteuererklärung (mit Steuerberater)', next_year: true },
      { form: 'GEWERBESTEUER', month: 7, day: 31, description: 'Gewerbesteuererklärung' },
      { form: 'EUER', month: 7, day: 31, description: 'EÜR (ohne Steuerberater)' }
    ];

    const now = new Date();
    const reminderDays = [30, 14, 7, 3, 1]; // Tage vor Frist

    const users = await base44.asServiceRole.entities.User.list();
    let notificationsSent = 0;

    for (const user of users) {
      // Hole Submissions des Users
      const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
        created_by: user.email
      });

      for (const deadline of deadlines) {
        const deadlineYear = deadline.next_year ? currentYear + 1 : currentYear;
        const deadlineDate = new Date(deadlineYear, deadline.month - 1, deadline.day);
        const daysUntil = Math.floor((deadlineDate - now) / (1000 * 60 * 60 * 24));

        // Prüfe ob Erinnerung fällig ist
        if (reminderDays.includes(daysUntil)) {
          // Prüfe ob bereits eingereicht
          const hasSubmitted = submissions.some(s => 
            s.tax_form_type === deadline.form &&
            s.tax_year === currentYear - 1 &&
            ['SUBMITTED', 'ACCEPTED'].includes(s.status)
          );

          if (!hasSubmitted) {
            // Sende Benachrichtigung
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: user.email,
              from_name: 'ImmoVerwalter ELSTER',
              subject: `⏰ Erinnerung: ${deadline.description} - Noch ${daysUntil} Tage`,
              body: `
Hallo ${user.full_name || 'dort'},

dies ist eine automatische Erinnerung für folgende Steuerfrist:

📋 ${deadline.description}
📅 Frist: ${deadlineDate.toLocaleDateString('de-DE')}
⏰ Verbleibend: ${daysUntil} Tage

Status: Noch nicht eingereicht

Sie können Ihre Steuererklärung direkt über ImmoVerwalter erstellen und einreichen:
👉 Zum ELSTER-Modul: [Link zur App]

${daysUntil <= 7 ? '⚠️ WICHTIG: Die Frist läuft bald ab!' : ''}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
              `.trim()
            });

            notificationsSent++;
            console.log(`[SENT] Reminder to ${user.email} for ${deadline.form} (${daysUntil} days)`);
          }
        }
      }
    }

    console.log(`[SUCCESS] Sent ${notificationsSent} deadline reminders`);

    return Response.json({
      success: true,
      notifications_sent: notificationsSent,
      checked_users: users.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});