import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel
    const [
      buildings,
      units,
      tenants,
      contracts,
      invoices,
      bankAccounts,
      documents,
      owners,
      onboardingData,
      packageConfig
    ] = await Promise.all([
      base44.entities.Building.list(),
      base44.entities.Unit.list(),
      base44.entities.Tenant.list(),
      base44.entities.LeaseContract.list(),
      base44.entities.Invoice.list(),
      base44.entities.BankAccount.list(),
      base44.entities.Document.list(),
      base44.entities.Owner.list(),
      base44.entities.UserOnboarding.filter({ user_id: user.id }),
      base44.entities.UserPackageConfiguration.filter({ user_id: user.id })
    ]);

    const onboarding = onboardingData[0] || { days_since_signup: 0, feature_usage: {}, data_quality_score: 0 };
    const config = packageConfig[0] || { package_type: 'easyVermieter', additional_modules: [] };

    // Calculate system state
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
        documents: documents.length,
        owners: owners.length
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

    return Response.json({ systemState });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});