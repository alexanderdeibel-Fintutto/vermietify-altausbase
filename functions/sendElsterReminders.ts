import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[REMINDER] Checking for pending ELSTER submissions...');

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
      status: 'VALIDATED'
    });

    console.log(`[INFO] Found ${submissions.length} validated submissions`);

    let reminders = 0;

    for (const submission of submissions) {
      try {
        const daysSinceValidation = Math.floor(
          (Date.now() - new Date(submission.created_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceValidation >= 7) {
          // Benachrichtigung erstellen
          await base44.asServiceRole.entities.Notification.create({
            user_id: submission.created_by,
            title: '🏛️ ELSTER-Übermittlung ausstehend',
            message: `Die ${submission.tax_form_type} für ${submission.tax_year} ist validiert und kann übermittelt werden.`,
            type: 'warning',
            action_url: '/ElsterIntegration',
            is_read: false
          });

          reminders++;
          console.log(`[REMINDER] Sent for submission ${submission.id}`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed for submission ${submission.id}:`, error);
      }
    }

    console.log(`[COMPLETE] Sent ${reminders} reminders`);

    return Response.json({
      success: true,
      reminders_sent: reminders,
      total_validated: submissions.length
    });

  } catch (error) {
    console.error('[FATAL ERROR] Reminder task failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});