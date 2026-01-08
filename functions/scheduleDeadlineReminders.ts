import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[DEADLINE-REMINDER] Checking for upcoming deadlines...');

    const now = new Date();
    const currentYear = now.getFullYear();

    // Standard ELSTER-Fristen
    const deadlines = [
      { type: 'ANLAGE_V', month: 7, day: 31, description: 'Einkommensteuererklärung' },
      { type: 'UMSATZSTEUER', month: 12, day: 31, description: 'Umsatzsteuererklärung' },
      { type: 'GEWERBESTEUER', month: 12, day: 31, description: 'Gewerbesteuererklärung' }
    ];

    const remindersToSend = [];

    for (const deadline of deadlines) {
      const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
      const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

      // Erinnere bei 60, 30, 14, 7 und 1 Tag vor Frist
      const reminderDays = [60, 30, 14, 7, 1];

      if (reminderDays.includes(daysUntilDeadline)) {
        // Finde unvollständige Submissions für diesen Typ
        const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
          tax_form_type: deadline.type,
          tax_year: currentYear - 1,
          status: { $in: ['DRAFT', 'AI_PROCESSED', 'VALIDATED'] }
        });

        if (submissions.length > 0) {
          remindersToSend.push({
            deadline,
            daysUntilDeadline,
            submissions
          });
        }
      }
    }

    console.log(`[DEADLINE-REMINDER] Found ${remindersToSend.length} reminders to send`);

    // Sende Benachrichtigungen
    for (const reminder of remindersToSend) {
      for (const sub of reminder.submissions) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'ELSTER-System',
            to: sub.created_by,
            subject: `⏰ ELSTER-Frist: ${reminder.daysUntilDeadline} Tage - ${reminder.deadline.description}`,
            body: `Die Abgabefrist für ${reminder.deadline.description} läuft in ${reminder.daysUntilDeadline} Tagen ab.\n\nIhre Submission für ${sub.tax_form_type} (Jahr ${sub.tax_year}) ist noch im Status "${sub.status}".\n\nBitte vervollständigen Sie die Submission zeitnah, um die Frist einzuhalten.`
          });

          // Log Notification
          await base44.asServiceRole.entities.ActivityLog.create({
            entity_type: 'ElsterSubmission',
            entity_id: sub.id,
            action: 'deadline_reminder_sent',
            metadata: {
              days_until_deadline: reminder.daysUntilDeadline,
              deadline_type: reminder.deadline.type,
              sent_at: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error(`Failed to send reminder for ${sub.id}:`, error);
        }
      }
    }

    return Response.json({
      success: true,
      reminders_sent: remindersToSend.reduce((sum, r) => sum + r.submissions.length, 0),
      deadline_checks: remindersToSend.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});