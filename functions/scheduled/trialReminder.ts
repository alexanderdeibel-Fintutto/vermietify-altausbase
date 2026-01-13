import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  console.log('Checking for expiring trials...');
  
  try {
    const now = new Date();
    
    // Alle Trial-Subscriptions laden
    const allTrials = await base44.asServiceRole.entities.UserSubscription.filter({
      status: 'TRIAL'
    });
    
    console.log(`Found ${allTrials.length} trial subscriptions`);
    
    let reminders3Day = 0;
    let reminders1Day = 0;
    
    for (const sub of allTrials) {
      if (!sub.data.subscription_end_date) continue;
      
      const endDate = new Date(sub.data.subscription_end_date);
      const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      // 3-Tage-Erinnerung
      if (daysUntilEnd === 3) {
        const tiers = await base44.asServiceRole.entities.PricingTier.filter({ id: sub.data.tier_id });
        const tier = tiers[0];
        
        if (tier) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: sub.data.user_email,
            subject: '🕐 Deine Testphase endet in 3 Tagen',
            body: `
Hallo,

deine kostenlose Testphase endet in 3 Tagen.

Dein aktueller Plan: ${tier.data.name}
Preis nach der Testphase: ${(tier.data.price_monthly / 100).toFixed(2)}€/Monat

Was passiert dann?
• Dein Abonnement wird automatisch aktiviert
• Deine gespeicherten Daten bleiben erhalten
• Du kannst jederzeit kündigen

Falls du nicht weitermachen möchtest, kannst du dein Abo vorher in den Einstellungen kündigen.

Viele Grüße
Dein Team
            `.trim()
          });
          
          reminders3Day++;
          console.log(`3-day reminder sent to: ${sub.data.user_email}`);
        }
      }
      
      // 1-Tag-Erinnerung
      if (daysUntilEnd === 1) {
        const tiers = await base44.asServiceRole.entities.PricingTier.filter({ id: sub.data.tier_id });
        const tier = tiers[0];
        
        if (tier) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: sub.data.user_email,
            subject: '⏰ Letzte Erinnerung: Deine Testphase endet morgen',
            body: `
Hallo,

deine Testphase endet morgen!

Ab dann wird dein ${tier.data.name}-Plan für ${(tier.data.price_monthly / 100).toFixed(2)}€/Monat aktiviert.

Noch Fragen? Antworte einfach auf diese E-Mail.

Viele Grüße
Dein Team
            `.trim()
          });
          
          reminders1Day++;
          console.log(`1-day reminder sent to: ${sub.data.user_email}`);
        }
      }
    }
    
    console.log(`Trial reminders sent: ${reminders3Day} (3-day), ${reminders1Day} (1-day)`);
    
    return Response.json({ 
      success: true, 
      reminders_3day: reminders3Day,
      reminders_1day: reminders1Day
    });
    
  } catch (error) {
    console.error('Trial reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});