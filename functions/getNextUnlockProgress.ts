import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system state
    const stateResponse = await base44.functions.invoke('calculateSystemState', {});
    const { systemState } = stateResponse.data;

    // Get existing unlocks
    const existingUnlocks = await base44.entities.FeatureUnlock.filter({ user_id: user.id });
    const unlockedKeys = new Set(existingUnlocks.map(u => u.feature_key));

    const nextUnlocks = [];

    // Define all unlock rules with names
    const unlockRules = [
      {
        key: 'zaehlerVerwaltung',
        name: 'Zählerverwaltung',
        type: 'time_based',
        requirement: { days: 7 },
        getMessage: (current, required) => `In ${required - current} Tagen verfügbar`
      },
      {
        key: 'betriebskostenabrechnung',
        name: 'Betriebskostenabrechnung',
        type: 'time_based',
        requirement: { days: 30, hasActiveTenants: true },
        getMessage: (current, required) => {
          if (!systemState.businessState.hasActiveTenants) return 'Erst verfügbar wenn Mieter angelegt sind';
          return `In ${required - current} Tagen verfügbar`;
        }
      },
      {
        key: 'mieterKommunikation',
        name: 'Mieter-Kommunikation',
        type: 'data_based',
        requirement: { contracts: 1 },
        getMessage: (current, required) => `${current} von ${required} Mietverträgen`
      },
      {
        key: 'portfolioAnalytics',
        name: 'Portfolio Analytics',
        type: 'data_based',
        requirement: { buildings: 3 },
        getMessage: (current, required) => `${current} von ${required} Gebäuden`
      },
      {
        key: 'tenantPortal',
        name: 'Mieter-Portal',
        type: 'data_based',
        requirement: { tenants: 10 },
        getMessage: (current, required) => `${current} von ${required} Mietern`
      },
      {
        key: 'aiCategorization',
        name: 'KI-Kategorisierung',
        type: 'data_based',
        requirement: { invoices: 100 },
        getMessage: (current, required) => `${current} von ${required} Rechnungen`
      },
      {
        key: 'automatedWorkflows',
        name: 'Automatisierte Workflows',
        type: 'time_based',
        requirement: { days: 90 },
        getMessage: (current, required) => `In ${required - current} Tagen verfügbar`
      },
      {
        key: 'aiOptimization',
        name: 'KI-Optimierung',
        type: 'time_based',
        requirement: { days: 365 },
        getMessage: (current, required) => `In ${required - current} Tagen verfügbar`
      }
    ];

    // Check each rule
    for (const rule of unlockRules) {
      if (unlockedKeys.has(rule.key)) continue;

      let current, required, progress, requirement;

      if (rule.type === 'time_based') {
        current = systemState.usage.daysSinceSignup;
        required = rule.requirement.days;
        
        // Check additional requirements
        if (rule.requirement.hasActiveTenants && !systemState.businessState.hasActiveTenants) {
          progress = 0;
        } else {
          progress = Math.min(Math.round((current / required) * 100), 100);
        }
        requirement = rule.getMessage(current, required);
      } else if (rule.type === 'data_based') {
        const dataKey = Object.keys(rule.requirement)[0];
        current = systemState.dataCompleteness[dataKey] || 0;
        required = rule.requirement[dataKey];
        progress = Math.min(Math.round((current / required) * 100), 100);
        requirement = rule.getMessage(current, required);
      }

      if (progress < 100 && progress > 0) {
        nextUnlocks.push({
          featureKey: rule.key,
          featureName: rule.name,
          progress,
          requirement,
          type: rule.type
        });
      }
    }

    // Sort by progress (closest to unlock first)
    nextUnlocks.sort((a, b) => b.progress - a.progress);

    return Response.json({ nextUnlocks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});