import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Evaluating onboarding state for user:', user.email);

    // Fetch or init user onboarding progress
    const onboardingRecords = await base44.entities.UserOnboarding.filter(
      { user_id: user.id },
      null,
      1
    );
    
    let onboarding = onboardingRecords[0];
    
    // Initialize if doesn't exist
    if (!onboarding) {
      console.log('Creating new UserOnboarding record for user:', user.id);
      onboarding = await base44.entities.UserOnboarding.create({
        user_id: user.id,
        completed_steps: [],
        onboarding_progress: 0,
        current_step: 'welcome',
        user_level: 'beginner',
        days_since_signup: 0
      });
    }

    // Fetch user package config
    const packageRecords = await base44.entities.UserPackageConfiguration.filter(
      { user_id: user.id },
      '-created_date',
      1
    );
    const packageConfig = packageRecords[0];

    // Fetch existing data counts with optimized queries and error handling
    const fetchSafe = async (entity, query) => {
      try {
        return await entity.filter(query, '-created_date', 1) || [];
      } catch (e) {
        console.warn(`Failed to fetch ${entity.constructor.name}:`, e.message);
        return [];
      }
    };

    const [buildings, bankAccounts, contracts, tasks, tenants, invoices] = await Promise.all([
      base44.entities.Building.filter({ created_by: user.email }, '-created_date', 5).catch(() => []),
      base44.entities.BankAccount.filter({ created_by: user.email }, '-created_date', 1).catch(() => []),
      base44.entities.LeaseContract.filter({ created_by: user.email }, '-created_date', 1).catch(() => []),
      base44.entities.Task.filter({ created_by: user.email }, '-created_date', 1).catch(() => []),
      (base44.entities.Tenant ? base44.entities.Tenant.filter({ created_by: user.email }, '-created_date', 1) : Promise.resolve([])).catch(() => []),
      (base44.entities.Invoice ? base44.entities.Invoice.filter({ created_by: user.email }, '-created_date', 1) : Promise.resolve([])).catch(() => [])
    ]);

    const buildingCount = buildings?.length || 0;
    const bankAccountCount = bankAccounts?.length || 0;
    const contractCount = contracts?.length || 0;
    const taskCount = tasks?.length || 0;
    const tenantCount = tenants?.length || 0;
    const invoiceCount = invoices?.length || 0;

    // Calculate user maturity level based on actions
    const userMaturityScore = buildingCount * 20 + bankAccountCount * 15 + contractCount * 25 + tenantCount * 10 + invoiceCount * 30;
    const userLevel = userMaturityScore >= 50 ? 'advanced' : userMaturityScore >= 25 ? 'intermediate' : 'beginner';

    // Define onboarding steps based on package and user maturity
    const packageType = packageConfig?.package_type || 'easyVermieter';
    
    const stepsByPackage = {
      easyVermieter: [
        {
          id: 'welcome',
          title: 'Willkommen bei ImmoVerwalter',
          description: 'Lassen Sie uns Ihr System einrichten',
          required: true,
          completed: onboarding?.completed_steps?.includes('welcome') || false,
          ai_explanation: 'Dies ist der erste Schritt, um Sie mit dem System vertraut zu machen.'
        },
        {
          id: 'add_building',
          title: 'Erstes Objekt hinzufügen',
          description: 'Erstellen Sie Ihr erstes Immobilien-Objekt',
          required: true,
          completed: buildingCount > 0 || onboarding?.completed_steps?.includes('add_building') || false,
          trigger: () => buildingCount === 0,
          ai_explanation: `Objekte sind das Fundament des Systems. Sie haben derzeit ${buildingCount} Objekt(e).`
        },
        {
          id: 'connect_bank',
          title: 'Bankkonto verbinden',
          description: 'Synchronisieren Sie Ihre Bankkonten mit FinAPI',
          required: false,
          completed: bankAccountCount > 0 || onboarding?.completed_steps?.includes('connect_bank') || false,
          trigger: () => buildingCount > 0 && bankAccountCount === 0,
          ai_explanation: `Bankkonten helfen bei der automatischen Buchungserfassung. Sie haben ${bankAccountCount} verbundene Konten.`
        },
        {
          id: 'add_tenant',
          title: 'Mieter & Verträge',
          description: 'Verwalten Sie Mieter und Mietverträge',
          required: false,
          completed: tenantCount > 0 || onboarding?.completed_steps?.includes('add_tenant') || false,
          trigger: () => buildingCount > 0,
          ai_explanation: `Mit ${tenantCount} Mieter(n) können Sie Verträge und Zahlungen verwalten.`
        },
        {
          id: 'setup_elster',
          title: 'ELSTER & Steuern',
          description: 'Konfigurieren Sie die Steuererklärung',
          required: false,
          completed: onboarding?.completed_steps?.includes('setup_elster') || false,
          trigger: () => invoiceCount > 0 || buildingCount > 0,
          ai_explanation: `ELSTER ist wichtig für die Steuererklärung. Sie haben ${invoiceCount} Rechnungen erfasst.`
        }
      ],
      easyKonto: [
        {
          id: 'welcome',
          title: 'Willkommen',
          description: 'Konto-Setup',
          required: true,
          completed: onboarding?.completed_steps?.includes('welcome') || false
        },
        {
          id: 'connect_bank',
          title: 'Bankkonto verbinden',
          description: 'Mit FinAPI synchronisieren',
          required: true,
          completed: bankAccountCount > 0 || onboarding?.completed_steps?.includes('connect_bank') || false,
          trigger: () => bankAccountCount === 0
        }
      ]
    };

    const steps = stepsByPackage[packageType] || stepsByPackage.easyVermieter;
    
    // Find next incomplete required step
    const nextRequiredStep = steps.find(step => step.required && !step.completed);
    
    // Find next incomplete optional steps that should be triggered (prioritized by user level)
    const optionalSteps = steps.filter(step => 
      !step.required && 
      !step.completed && 
      step.trigger && 
      step.trigger()
    );

    // Prioritize next optional steps based on user maturity
    const nextOptionalStep = userLevel === 'advanced' 
      ? optionalSteps[optionalSteps.length - 1] 
      : optionalSteps[0];

    // Check if skipped recently (within 24h)
    const skipUntil = onboarding?.skip_until ? new Date(onboarding.skip_until) : null;
    const isCurrentlySkipped = skipUntil && new Date() < skipUntil;

    // Determine if onboarding assistant should be visible
    const nextStep = nextRequiredStep || nextOptionalStep;
    const shouldShowOnboarding = !!nextStep && !isCurrentlySkipped;

    // Calculate progress
    const completedSteps = steps.filter(s => s.completed).length;
    const progress = Math.round((completedSteps / steps.length) * 100);

    // AI-driven insights about user actions
    const userInsights = {
      buildings_added: buildingCount,
      accounts_connected: bankAccountCount,
      contracts_created: contractCount,
      tenants_managed: tenantCount,
      invoices_created: invoiceCount,
      user_level: userLevel,
      maturity_score: userMaturityScore
    };

    const state = {
      user_id: user.id,
      package_type: packageType,
      should_show_onboarding: shouldShowOnboarding,
      next_step: nextStep || null,
      completed_steps: onboarding?.completed_steps || [],
      all_steps: steps,
      optional_steps_available: optionalSteps.map(s => ({ id: s.id, title: s.title })),
      progress,
      data_status: {
        buildings: buildingCount,
        bank_accounts: bankAccountCount,
        contracts: contractCount,
        tasks: taskCount,
        tenants: tenantCount,
        invoices: invoiceCount
      },
      user_insights: userInsights,
      last_evaluated: new Date().toISOString()
    };

    return Response.json({
      success: true,
      state
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});