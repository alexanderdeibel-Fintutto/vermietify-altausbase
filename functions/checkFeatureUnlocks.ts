import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();
    const { systemState } = data;

    const newUnlocks = [];
    const existingUnlocks = await base44.entities.FeatureUnlock.filter({ user_id: user.id });
    const unlockedKeys = new Set(existingUnlocks.map(u => u.feature_key));

    // Time-based unlocks
    const timeBasedRules = {
      'zaehlerVerwaltung': { days: 7, reason: 'time_based' },
      'betriebskostenabrechnung': { days: 30, hasActiveTenants: true, reason: 'time_based' },
      'automatedWorkflows': { days: 90, reason: 'time_based' },
      'aiOptimization': { days: 365, reason: 'time_based' }
    };

    for (const [key, rule] of Object.entries(timeBasedRules)) {
      if (!unlockedKeys.has(key) && systemState.usage.daysSinceSignup >= rule.days) {
        if (rule.hasActiveTenants && !systemState.businessState.hasActiveTenants) continue;
        
        newUnlocks.push({
          user_id: user.id,
          feature_key: key,
          unlock_reason: rule.reason,
          trigger_data: { days: systemState.usage.daysSinceSignup },
          notification_shown: false
        });
      }
    }

    // Data-triggered unlocks
    const dataRules = {
      'mieterKommunikation': { contracts: 1, reason: 'data_based' },
      'portfolioAnalytics': { buildings: 3, reason: 'data_based' },
      'tenantPortal': { tenants: 10, reason: 'data_based' },
      'aiCategorization': { invoices: 100, reason: 'data_based' }
    };

    for (const [key, rule] of Object.entries(dataRules)) {
      if (!unlockedKeys.has(key)) {
        const trigger = Object.keys(rule).find(k => k !== 'reason');
        if (systemState.dataCompleteness[trigger] >= rule[trigger]) {
          newUnlocks.push({
            user_id: user.id,
            feature_key: key,
            unlock_reason: rule.reason,
            trigger_data: { [trigger]: systemState.dataCompleteness[trigger] },
            notification_shown: false
          });
        }
      }
    }

    // Create new unlocks
    if (newUnlocks.length > 0) {
      await base44.entities.FeatureUnlock.bulkCreate(newUnlocks);
    }

    return Response.json({ newUnlocks, totalUnlocked: existingUnlocks.length + newUnlocks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});