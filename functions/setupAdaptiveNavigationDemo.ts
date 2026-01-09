import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 1. Initialize user subscription fields
    await base44.asServiceRole.auth.updateMe({
      subscription_plan: 'easyVermieter',
      subscription_addons: ['kommunikation', 'dokumentation'],
      subscription_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      role_in_company: 'verwalter',
      enabled_features: ['dashboard', 'finanzen', 'immobilien', 'mieter', 'steuer'],
      last_feature_check: new Date().toISOString()
    });

    // 2. Create UserPackageConfiguration
    const existingConfig = await base44.asServiceRole.entities.UserPackageConfiguration.filter({ user_id: user.id });
    if (existingConfig.length === 0) {
      await base44.asServiceRole.entities.UserPackageConfiguration.create({
        user_id: user.id,
        package_type: 'easyVermieter',
        max_buildings: 5,
        max_units: 999,
        additional_modules: ['kommunikation', 'dokumentation'],
        valid_from: new Date().toISOString().split('T')[0],
        price_per_month: 39.99,
        is_active: true
      });
    }

    // 3. Create sample UserOnboarding
    const existingOnboarding = await base44.asServiceRole.entities.UserOnboarding.filter({ user_id: user.id });
    if (existingOnboarding.length === 0) {
      await base44.asServiceRole.entities.UserOnboarding.create({
        user_id: user.id,
        completed_steps: ['account_created', 'first_building'],
        current_step: 'add_first_tenant',
        onboarding_progress: 40,
        feature_usage: {
          buildings: 2,
          tenants: 1,
          invoices: 5
        },
        data_quality_score: 65,
        days_since_signup: 14,
        user_level: 'intermediate',
        last_activity: new Date().toISOString()
      });
    }

    // 4. Initialize NavigationState
    await base44.functions.invoke('updateNavigationState', {});

    // 5. Create sample FeatureUnlock
    await base44.asServiceRole.entities.FeatureUnlock.create({
      user_id: user.id,
      feature_key: 'betriebskostenabrechnung',
      unlock_reason: 'data_based',
      trigger_data: { contracts: 3, mieter: 2 },
      notification_shown: false
    });

    return Response.json({ 
      success: true,
      message: 'Adaptive Navigation Demo Setup Complete',
      details: {
        userUpdated: true,
        packageConfigCreated: true,
        onboardingCreated: true,
        navigationStateInitialized: true,
        sampleUnlockCreated: true
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});