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
    const unlockedMap = new Map(existingUnlocks.map(u => [u.feature_key, u]));

    // Define all features
    const allFeatures = [
      {
        key: 'dashboard',
        name: 'Dashboard',
        description: 'Zentrale Übersicht über deine Immobilien und Finanzen',
        category: 'core',
        unlocked: true,
        alwaysUnlocked: true
      },
      {
        key: 'finanzen',
        name: 'Finanzverwaltung',
        description: 'Verwaltung von Einnahmen, Ausgaben und Transaktionen',
        category: 'core',
        unlocked: true,
        alwaysUnlocked: true
      },
      {
        key: 'steuer',
        name: 'Steuerverwaltung',
        description: 'ELSTER-Integration und automatische Steuerformulare',
        category: 'core',
        unlocked: true,
        alwaysUnlocked: true
      },
      {
        key: 'immobilien',
        name: 'Immobilienverwaltung',
        description: 'Verwaltung deiner Gebäude und Einheiten',
        category: 'core',
        unlocked: true,
        alwaysUnlocked: true
      },
      {
        key: 'mieter',
        name: 'Mieterverwaltung',
        description: 'Verwaltung von Mietern und Mietverträgen',
        category: 'core',
        unlocked: systemState.dataCompleteness.buildings > 0 || systemState.subscription.plan.includes('Vermieter'),
        unlockRequirement: 'Verfügbar wenn erstes Gebäude angelegt'
      },
      {
        key: 'zaehlerVerwaltung',
        name: 'Zählerverwaltung',
        description: 'Erfassung und Auswertung von Zählerständen',
        category: 'advanced',
        unlockType: 'time_based',
        requiredDays: 7,
        unlockRequirement: 'Nach 7 Tagen Nutzung verfügbar'
      },
      {
        key: 'mieterKommunikation',
        name: 'Mieter-Kommunikation',
        description: 'Nachrichten und Benachrichtigungen an Mieter',
        category: 'advanced',
        unlockType: 'data_based',
        requiredContracts: 1,
        unlockRequirement: 'Verfügbar ab 1 Mietvertrag'
      },
      {
        key: 'betriebskostenabrechnung',
        name: 'Betriebskostenabrechnung',
        description: 'Automatische Erstellung von Nebenkostenabrechnungen',
        category: 'advanced',
        unlockType: 'time_based',
        requiredDays: 30,
        additionalCheck: 'hasActiveTenants',
        unlockRequirement: 'Nach 30 Tagen mit aktiven Mietern verfügbar'
      },
      {
        key: 'portfolioAnalytics',
        name: 'Portfolio Analytics',
        description: 'Detaillierte Auswertungen und Reports für dein Portfolio',
        category: 'advanced',
        unlockType: 'data_based',
        requiredBuildings: 3,
        unlockRequirement: 'Verfügbar ab 3 Gebäuden'
      },
      {
        key: 'tenantPortal',
        name: 'Mieter-Portal',
        description: 'Self-Service Portal für deine Mieter',
        category: 'premium',
        unlockType: 'data_based',
        requiredTenants: 10,
        unlockRequirement: 'Verfügbar ab 10 Mietern'
      },
      {
        key: 'aiCategorization',
        name: 'KI-Kategorisierung',
        description: 'Automatische Kategorisierung von Rechnungen mit KI',
        category: 'premium',
        unlockType: 'data_based',
        requiredInvoices: 100,
        unlockRequirement: 'Verfügbar ab 100 Rechnungen'
      },
      {
        key: 'automatedWorkflows',
        name: 'Automatisierte Workflows',
        description: 'Automatisierung wiederkehrender Aufgaben',
        category: 'premium',
        unlockType: 'time_based',
        requiredDays: 90,
        unlockRequirement: 'Nach 90 Tagen Nutzung verfügbar'
      },
      {
        key: 'aiOptimization',
        name: 'KI-Optimierung',
        description: 'KI-gestützte Optimierungsvorschläge für dein Portfolio',
        category: 'premium',
        unlockType: 'time_based',
        requiredDays: 365,
        unlockRequirement: 'Nach 1 Jahr Nutzung verfügbar'
      }
    ];

    // Process each feature
    const catalog = allFeatures.map(feature => {
      const unlock = unlockedMap.get(feature.key);
      let progress = 0;

      if (feature.alwaysUnlocked) {
        return { ...feature, unlocked: true, progress: 100 };
      }

      if (unlock) {
        return {
          ...feature,
          unlocked: true,
          progress: 100,
          unlockedAt: unlock.created_date,
          unlockReason: unlock.unlock_reason
        };
      }

      // Calculate progress for locked features
      if (feature.unlockType === 'time_based') {
        const current = systemState.usage.daysSinceSignup;
        const required = feature.requiredDays;
        
        if (feature.additionalCheck === 'hasActiveTenants' && !systemState.businessState.hasActiveTenants) {
          progress = 0;
        } else {
          progress = Math.min(Math.round((current / required) * 100), 99);
        }
      } else if (feature.unlockType === 'data_based') {
        if (feature.requiredContracts) {
          progress = Math.min(Math.round((systemState.dataCompleteness.contracts / feature.requiredContracts) * 100), 99);
        } else if (feature.requiredBuildings) {
          progress = Math.min(Math.round((systemState.dataCompleteness.buildings / feature.requiredBuildings) * 100), 99);
        } else if (feature.requiredTenants) {
          progress = Math.min(Math.round((systemState.dataCompleteness.tenants / feature.requiredTenants) * 100), 99);
        } else if (feature.requiredInvoices) {
          progress = Math.min(Math.round((systemState.dataCompleteness.invoices / feature.requiredInvoices) * 100), 99);
        }
      }

      return {
        ...feature,
        unlocked: feature.unlocked || false,
        progress
      };
    });

    const unlockedCount = catalog.filter(f => f.unlocked).length;
    const totalCount = catalog.length;

    return Response.json({ catalog, unlockedCount, totalCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});