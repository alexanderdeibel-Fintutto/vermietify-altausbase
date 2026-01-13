import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  console.log('Generating monthly usage report...');
  
  try {
    const allSubs = await base44.asServiceRole.entities.UserSubscription.list();
    const activeSubs = allSubs.filter(s => ['active', 'trialing'].includes(s.status));
    const trialSubs = allSubs.filter(s => s.status === 'trialing');
    
    const now = new Date();
    const canceledThisMonth = allSubs.filter(s => {
      if (s.status !== 'canceled' || !s.canceled_at) return false;
      const cancelDate = new Date(s.canceled_at);
      return cancelDate.getMonth() === now.getMonth() && cancelDate.getFullYear() === now.getFullYear();
    });

    let totalMRR = 0;
    const planDistribution = {};
    
    for (const sub of activeSubs) {
      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ id: sub.plan_id });
      const plan = plans[0];
      
      if (plan) {
        planDistribution[plan.name] = (planDistribution[plan.name] || 0) + 1;
        
        if (sub.billing_cycle === 'yearly') {
          totalMRR += plan.price_yearly / 12;
        } else {
          totalMRR += plan.price_monthly;
        }
      }

      const addons = await base44.asServiceRole.entities.UserAddOn.filter({
        subscription_id: sub.id,
        status: 'active',
        is_included_in_plan: false
      });
      
      for (const addon of addons) {
        totalMRR += addon.price_at_purchase;
      }
    }

    const reportDate = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'alexander@fintutto.de',
      subject: `📊 FinTutto Monatsreport - ${reportDate}`,
      body: `
FinTutto Subscription Report - ${reportDate}
============================================

ÜBERSICHT
---------
Aktive Abonnements: ${activeSubs.length}
Davon in Testphase: ${trialSubs.length}
Kündigungen diesen Monat: ${canceledThisMonth.length}

UMSATZ
------
MRR (Monthly Recurring Revenue): ${(totalMRR / 100).toFixed(2)}€
ARR (Annual Recurring Revenue): ${((totalMRR * 12) / 100).toFixed(2)}€

PLAN-VERTEILUNG
---------------
${Object.entries(planDistribution).map(([name, count]) => `${name}: ${count} (${Math.round(count / activeSubs.length * 100)}%)`).join('\n')}

---
Automatisch generiert von FinTutto
      `.trim()
    });

    console.log('Monthly report sent');
    return Response.json({ success: true, mrr: totalMRR, active: activeSubs.length });
    
  } catch (error) {
    console.error('Monthly report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});