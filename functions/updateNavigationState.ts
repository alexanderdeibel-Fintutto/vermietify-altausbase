import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate system state
    const stateResponse = await base44.functions.invoke('calculateSystemState', {});
    const { systemState } = stateResponse.data;

    // Check for feature unlocks
    await base44.functions.invoke('checkFeatureUnlocks', { systemState });

    // Get all feature unlocks
    const featureUnlocks = await base44.entities.FeatureUnlock.filter({ user_id: user.id });
    const unlockedFeatures = new Set(featureUnlocks.map(u => u.feature_key));

    // Compute visible features
    const visibleFeatures = computeVisibleFeatures(systemState, unlockedFeatures);

    // Update or create NavigationState
    const existing = await base44.entities.NavigationState.filter({ user_id: user.id });
    
    const navData = {
      user_id: user.id,
      computed_navigation: { main: visibleFeatures },
      system_state: systemState,
      visible_features: Array.from(visibleFeatures),
      unlock_notifications: featureUnlocks.filter(u => !u.notification_shown).map(u => u.feature_key),
      last_computed: new Date().toISOString()
    };

    if (existing.length > 0) {
      await base44.entities.NavigationState.update(existing[0].id, navData);
    } else {
      await base44.entities.NavigationState.create(navData);
    }

    return Response.json({ success: true, visibleFeatures: Array.from(visibleFeatures) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function computeVisibleFeatures(systemState, unlockedFeatures) {
  const features = new Set(['dashboard', 'finanzen', 'steuer', 'account']);

  const { subscription, dataCompleteness, businessState } = systemState;

  // IMMOBILIEN
  if (subscription.plan !== 'easyPrivat' && (dataCompleteness.buildings > 0 || true)) {
    features.add('immobilien');
  }

  // MIETER
  if (subscription.plan >= 'easyVermieter' && (dataCompleteness.tenants > 0 || dataCompleteness.buildings > 0)) {
    features.add('mieter');
  }

  // FIRMA
  if (subscription.plan === 'easyFirma') {
    features.add('firma');
  }

  // Add unlocked features
  unlockedFeatures.forEach(f => features.add(f));

  return features;
}