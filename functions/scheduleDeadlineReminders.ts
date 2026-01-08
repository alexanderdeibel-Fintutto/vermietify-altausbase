import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[DEADLINE-REMINDERS] Starting scheduled check');

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();

    // Definiere Fristen
    const deadlines = [
      { form: 'ANLAGE_V', month: 7, day: 31, label: 'Anlage V' },
      { form: 'EUER', month: 7, day: 31, label: 'EÜR' },
      { form: 'GEWERBESTEUER', month: 7, day: 31, label: 'Gewerbesteuer' },
      { form: 'UMSATZSTEUER', month: 7, day: 31, label: 'Umsatzsteuer' }
    ];

    const results = {
      reminders_sent: 0,
      skipped: 0,
      errors: 0
    };

    for (const deadline of deadlines) {
      // Prüfe ob Frist in 30 Tagen ist
      const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
      const daysUntilDeadline = Math.floor((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));

      if (daysUntilDeadline !== 30 && daysUntilDeadline !== 14 && daysUntilDeadline !== 7) {
        continue; // Nur bei 30, 14 und 7 Tagen erinnern
      }

      console.log(`[INFO] Deadline ${deadline.label} in ${daysUntilDeadline} Tagen`);

      // Hole alle unvollständigen Submissions
      const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
        tax_form_type: deadline.form,
        tax_year: currentYear - 1,
        status: { $in: ['DRAFT', 'AI_PROCESSED', 'VALIDATED'] }
      });

      for (const submission of submissions) {
        try {
          await base44.asServiceRole.functions.invoke('sendElsterEmailNotification', {
            submission_id: submission.id,
            notification_type: 'deadline_reminder',
            recipient_email: submission.created_by
          });

          results.reminders_sent++;
        } catch (error) {
          console.error(`[ERROR] Failed to send reminder for ${submission.id}:`, error);
          results.errors++;
        }
      }
    }

    console.log(`[DEADLINE-REMINDERS] Complete: ${results.reminders_sent} sent, ${results.errors} errors`);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});