import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[TRIAL] Starting trial reminder check...');

    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Get all trial subscriptions expiring in 3 days
    const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({
      status: 'TRIAL'
    });

    let sentCount = 0;

    for (const sub of subscriptions) {
      if (!sub.trial_end_date) continue;

      const endDate = new Date(sub.trial_end_date);
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      // Send reminder 3 days before trial ends
      if (daysLeft === 3 || daysLeft === 1) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: sub.user_email,
            subject: `Ihre Trial-Phase endet in ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'}`,
            body: `
              Hallo,

              Ihre Trial-Phase endet in ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'}.

              Um weiterhin alle Features nutzen zu können, upgraden Sie jetzt zu einem bezahlten Plan.

              Zur Übersicht: https://app.fintutto.de/subscription

              Vielen Dank,
              Ihr FinTutto Team
            `
          });

          sentCount++;
          console.log(`[TRIAL] Sent reminder to ${sub.user_email} (${daysLeft} days left)`);
        } catch (error) {
          console.error(`[TRIAL] Error sending to ${sub.user_email}:`, error);
        }
      }
    }

    console.log(`[TRIAL] Completed. Sent ${sentCount} reminders.`);

    return Response.json({
      success: true,
      checked: subscriptions.length,
      sent: sentCount
    });

  } catch (error) {
    console.error('[TRIAL] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});