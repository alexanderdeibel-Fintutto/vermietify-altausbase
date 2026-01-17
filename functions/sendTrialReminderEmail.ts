import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all trial subscriptions
    const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({
      status: 'TRIAL'
    });

    const now = new Date();
    let emailsSent = 0;

    for (const sub of subscriptions) {
      const trialEnd = new Date(sub.trial_end_date);
      const daysUntilEnd = (trialEnd - now) / (1000 * 60 * 60 * 24);

      // Send reminder 3 days before trial ends
      if (daysUntilEnd > 2.5 && daysUntilEnd < 3.5) {
        await base44.integrations.Core.SendEmail({
          to: sub.user_email,
          subject: 'Ihre Testphase endet bald - Jetzt upgraden! ⏰',
          body: `Hallo,\n\nIhre 14-tägige Testphase von vermitify endet in 3 Tagen.\n\nUpgraden Sie jetzt auf Professional und:\n✓ Sparen Sie 20% bei jährlicher Zahlung\n✓ Behalten Sie alle Ihre Daten\n✓ Nutzen Sie alle Premium-Features\n\nJetzt upgraden:\nhttps://app.vermitify.de/pricing\n\nBeste Grüße\nIhr vermitify Team`,
          from_name: 'vermitify Team'
        });
        emailsSent++;
      }

      // Send final reminder 1 day before
      if (daysUntilEnd > 0.5 && daysUntilEnd < 1.5) {
        await base44.integrations.Core.SendEmail({
          to: sub.user_email,
          subject: 'Letzte Chance - Trial endet morgen! 🚨',
          body: `Hallo,\n\nIhre Testphase endet morgen!\n\nUpgraden Sie jetzt, um:\n✓ Ihre Daten zu behalten\n✓ Alle Features weiter zu nutzen\n✓ 20% bei jährlicher Zahlung zu sparen\n\nJetzt upgraden:\nhttps://app.vermitify.de/pricing\n\nBeste Grüße\nIhr vermitify Team`,
          from_name: 'vermitify Team'
        });
        emailsSent++;
      }
    }

    return Response.json({ 
      success: true, 
      emails_sent: emailsSent 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});