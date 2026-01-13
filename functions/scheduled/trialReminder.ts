import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  console.log('Checking for expiring trials...');
  
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    
    const trialsEndingIn3Days = await base44.asServiceRole.entities.UserSubscription.filter({
      status: 'trialing',
      trial_end: {
        $gte: threeDaysFromNow.toISOString().split('T')[0],
        $lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    });
    
    for (const sub of trialsEndingIn3Days) {
      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ id: sub.plan_id });
      const plan = plans[0];
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: sub.user_email,
        subject: '🕐 Deine Testphase endet in 3 Tagen - FinTutto',
        body: `
Hallo,

deine kostenlose Testphase bei FinTutto endet in 3 Tagen.

Dein aktueller Plan: ${plan.name}
Preis nach der Testphase: ${(plan.price_monthly / 100).toFixed(2)}€/Monat

Was passiert dann?
• Dein Abonnement wird automatisch aktiviert
• Deine gespeicherten Daten bleiben erhalten
• Du kannst jederzeit kündigen

Falls du nicht weitermachen möchtest, kannst du dein Abo vorher in den Einstellungen kündigen.

Viele Grüße
Dein FinTutto Team

---
Diese E-Mail wurde automatisch versendet.
        `.trim()
      });
      
      console.log(`3-day reminder sent to: ${sub.user_email}`);
    }
    
    const trialsEndingTomorrow = await base44.asServiceRole.entities.UserSubscription.filter({
      status: 'trialing',
      trial_end: {
        $gte: oneDayFromNow.toISOString().split('T')[0],
        $lt: new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    });
    
    for (const sub of trialsEndingTomorrow) {
      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ id: sub.plan_id });
      const plan = plans[0];
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: sub.user_email,
        subject: '⏰ Letzte Erinnerung: Deine Testphase endet morgen - FinTutto',
        body: `
Hallo,

deine Testphase endet morgen!

Ab dann wird dein ${plan.name}-Plan für ${(plan.price_monthly / 100).toFixed(2)}€/Monat aktiviert.

Noch Fragen? Antworte einfach auf diese E-Mail.

Viele Grüße
Dein FinTutto Team
        `.trim()
      });
      
      console.log(`1-day reminder sent to: ${sub.user_email}`);
    }
    
    return Response.json({ 
      success: true, 
      reminders_3day: trialsEndingIn3Days.length,
      reminders_1day: trialsEndingTomorrow.length
    });
    
  } catch (error) {
    console.error('Trial reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});