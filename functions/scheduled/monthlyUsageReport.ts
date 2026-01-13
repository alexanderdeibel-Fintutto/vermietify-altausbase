import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  console.log('Generating monthly usage report...');
  
  try {
    // Alle Subscriptions laden
    const allSubs = await base44.asServiceRole.entities.UserSubscription.list();
    
    // Statistiken sammeln
    const activeSubs = allSubs.filter(s => s.data.status === 'ACTIVE');
    const trialSubs = allSubs.filter(s => s.data.status === 'TRIAL');
    const canceledThisMonth = allSubs.filter(s => {
      if (s.data.status !== 'CANCELLED') return false;
      if (!s.data.canceled_at) return false;
      
      const cancelDate = new Date(s.data.canceled_at);
      const now = new Date();
      return cancelDate.getMonth() === now.getMonth() && 
             cancelDate.getFullYear() === now.getFullYear();
    });
    
    // MRR berechnen (Monthly Recurring Revenue)
    let totalMRR = 0;
    const tierStats = {};
    
    for (const sub of activeSubs) {
      const tiers = await base44.asServiceRole.entities.PricingTier.filter({ id: sub.data.tier_id });
      const tier = tiers[0];
      
      if (tier) {
        if (sub.data.billing_cycle === 'YEARLY') {
          totalMRR += tier.data.price_yearly ? tier.data.price_yearly / 12 : 0;
        } else {
          totalMRR += tier.data.price_monthly;
        }
        
        // Tier-Verteilung
        tierStats[tier.data.name] = (tierStats[tier.data.name] || 0) + 1;
      }
    }
    
    // Report erstellen
    const reportDate = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    
    const tierDistribution = Object.entries(tierStats)
      .map(([name, count]) => `${name}: ${count} (${Math.round(count / activeSubs.length * 100)}%)`)
      .join('\n');
    
    // E-Mail an alle Admins
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    
    for (const admin of adminUsers) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.data.email,
        subject: `📊 Monatsreport Subscriptions - ${reportDate}`,
        body: `
Subscription Report - ${reportDate}
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
${tierDistribution || 'Keine aktiven Subscriptions'}

---
Automatisch generiert
        `.trim()
      });
    }
    
    console.log(`Monthly report sent to ${adminUsers.length} admins`);
    
    return Response.json({ 
      success: true, 
      mrr: totalMRR, 
      active: activeSubs.length,
      admins_notified: adminUsers.length
    });
    
  } catch (error) {
    console.error('Monthly report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});