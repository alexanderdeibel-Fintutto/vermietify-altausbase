import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({
      status: 'TRIAL'
    });

    const now = new Date();
    
    for (const subscription of subscriptions) {
      const trialEnd = new Date(subscription.trial_end_date);
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

      if (daysLeft === 3 || daysLeft === 1) {
        await base44.integrations.Core.SendEmail({
          to: subscription.user_email,
          subject: `Ihre Testphase endet in ${daysLeft} Tag${daysLeft > 1 ? 'en' : ''}`,
          body: `Hallo,\n\nIhre Testphase bei Vermitify endet in ${daysLeft} Tag${daysLeft > 1 ? 'en' : ''}. Upgraden Sie jetzt, um alle Features weiter zu nutzen.\n\nViele Grüße,\nIhr Vermitify Team`
        });
      }
    }

    return Response.json({ 
      success: true, 
      emails_sent: subscriptions.length 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});