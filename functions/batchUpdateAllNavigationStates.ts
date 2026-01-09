import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    let updated = 0;
    let errors = 0;

    for (const targetUser of users) {
      try {
        // Calculate system state for this user
        const [
          buildings,
          units,
          tenants,
          contracts,
          invoices,
          bankAccounts,
          documents,
          onboardingData,
          packageConfig
        ] = await Promise.all([
          base44.asServiceRole.entities.Building.filter({ created_by: targetUser.email }),
          base44.asServiceRole.entities.Unit.filter({ created_by: targetUser.email }),
          base44.asServiceRole.entities.Tenant.filter({ created_by: targetUser.email }),
          base44.asServiceRole.entities.LeaseContract.filter({ created_by: targetUser.email }),
          base44.asServiceRole.entities.Invoice.filter({ created_by: targetUser.email }),
          base44.asServiceRole.entities.BankAccount.filter({ created_by: targetUser.email }),
          base44.asServiceRole.entities.Document.filter({ created_by: targetUser.email }),
          base44.asServiceRole.entities.UserOnboarding.filter({ user_id: targetUser.id }),
          base44.asServiceRole.entities.UserPackageConfiguration.filter({ user_id: targetUser.id })
        ]);

        const onboarding = onboardingData[0] || { days_since_signup: 0, feature_usage: {}, data_quality_score: 0 };
        const config = packageConfig[0] || { package_type: 'easyVermieter', additional_modules: [] };

        const systemState = {
          subscription: {
            plan: config.package_type,
            addons: config.additional_modules || [],
            features: config.additional_modules || []
          },
          dataCompleteness: {
            buildings: buildings.length,
            units: units.length,
            tenants: tenants.length,
            contracts: contracts.length,
            invoices: invoices.length,
            bankAccounts: bankAccounts.length,
            documents: documents.length
          },
          usage: {
            daysSinceSignup: onboarding.days_since_signup || 0,
            completedOnboardingSteps: onboarding.completed_steps?.length || 0,
            featureUsage: onboarding.feature_usage || {},
            dataQualityScore: onboarding.data_quality_score || 0
          },
          businessState: {
            hasActiveTenants: tenants.length > 0,
            hasFinancialData: invoices.length > 0 || bankAccounts.length > 0,
            hasBuildings: buildings.length > 0,
            hasContracts: contracts.length > 0,
            hasDocuments: documents.length > 0
          }
        };

        // Check for feature unlocks
        const featureUnlocks = await base44.asServiceRole.entities.FeatureUnlock.filter({ user_id: targetUser.id });
        const unlockedFeatures = new Set(featureUnlocks.map(u => u.feature_key));

        // Compute visible features
        const visibleFeatures = computeVisibleFeatures(systemState, unlockedFeatures);

        // Update NavigationState
        const existing = await base44.asServiceRole.entities.NavigationState.filter({ user_id: targetUser.id });
        
        const navData = {
          user_id: targetUser.id,
          computed_navigation: { main: Array.from(visibleFeatures) },
          system_state: systemState,
          visible_features: Array.from(visibleFeatures),
          unlock_notifications: featureUnlocks.filter(u => !u.notification_shown).map(u => u.feature_key),
          last_computed: new Date().toISOString()
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.NavigationState.update(existing[0].id, navData);
        } else {
          await base44.asServiceRole.entities.NavigationState.create(navData);
        }

        updated++;
      } catch (err) {
        console.error(`Error updating navigation for user ${targetUser.id}:`, err);
        errors++;
      }
    }

    return Response.json({ 
      success: true, 
      totalUsers: users.length,
      updated,
      errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function computeVisibleFeatures(systemState, unlockedFeatures) {
  const features = new Set(['dashboard', 'finanzen', 'steuer', 'account']);

  const { subscription, dataCompleteness, businessState } = systemState;

  // IMMOBILIEN
  if (subscription.plan !== 'easyKonto' && (dataCompleteness.buildings > 0 || subscription.plan.includes('Vermieter') || subscription.plan.includes('Home'))) {
    features.add('immobilien');
  }

  // MIETER
  if ((subscription.plan.includes('Vermieter') || subscription.plan === 'easyGewerbe') && (dataCompleteness.tenants > 0 || dataCompleteness.buildings > 0)) {
    features.add('mieter');
  }

  // FIRMA
  if (subscription.plan === 'easyGewerbe') {
    features.add('firma');
  }

  // Add all unlocked features
  unlockedFeatures.forEach(f => features.add(f));

  return features;
}