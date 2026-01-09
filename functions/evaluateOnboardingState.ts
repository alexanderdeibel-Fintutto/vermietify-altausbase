import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Evaluating onboarding state for user:', user.email);

    // Fetch user onboarding progress
    const onboardingRecords = await base44.entities.UserOnboarding.filter(
      { user_id: user.id },
      null,
      1
    );
    const onboarding = onboardingRecords[0];

    // Fetch user package config
    const packageRecords = await base44.entities.UserPackageConfiguration.filter(
      { user_id: user.id },
      '-created_date',
      1
    );
    const packageConfig = packageRecords[0];

    // Fetch existing data counts
    const [buildings, bankAccounts, contracts, tasks] = await Promise.all([
      base44.entities.Building.filter({}, null, 1),
      base44.entities.BankAccount.filter({}, null, 1),
      base44.entities.LeaseContract.filter({}, null, 1),
      base44.entities.Task.filter({}, null, 1)
    ]);

    const buildingCount = buildings.length;
    const bankAccountCount = bankAccounts.length;
    const contractCount = contracts.length;
    const taskCount = tasks.length;

    // Define onboarding steps based on package
    const packageType = packageConfig?.package_type || 'easyVermieter';
    
    const stepsByPackage = {
      easyVermieter: [
        {
          id: 'welcome',
          title: 'Willkommen bei ImmoVerwalter',
          description: 'Lassen Sie uns Ihr System einrichten',
          required: true,
          completed: onboarding?.completed_steps?.includes('welcome') || false
        },
        {
          id: 'add_building',
          title: 'Erstes Objekt hinzufügen',
          description: 'Erstellen Sie Ihr erstes Immobilien-Objekt',
          required: true,
          completed: buildingCount > 0 || onboarding?.completed_steps?.includes('add_building') || false,
          trigger: () => buildingCount === 0
        },
        {
          id: 'connect_bank',
          title: 'Bankkonto verbinden',
          description: 'Synchronisieren Sie Ihre Bankkonten mit FinAPI',
          required: false,
          completed: bankAccountCount > 0 || onboarding?.completed_steps?.includes('connect_bank') || false,
          trigger: () => buildingCount > 0 && bankAccountCount === 0
        },
        {
          id: 'add_tenant',
          title: 'Mieter hinzufügen',
          description: 'Registrieren Sie Ihre ersten Mieter',
          required: false,
          completed: onboarding?.completed_steps?.includes('add_tenant') || false,
          trigger: () => buildingCount > 0 && contractCount === 0
        },
        {
          id: 'setup_elster',
          title: 'ELSTER-Verbindung',
          description: 'Konfigurieren Sie die Steuererklärung',
          required: false,
          completed: onboarding?.completed_steps?.includes('setup_elster') || false,
          trigger: () => buildingCount > 0
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
    
    // Find next incomplete optional step that should be triggered
    const nextOptionalStep = steps.find(step => 
      !step.required && 
      !step.completed && 
      step.trigger && 
      step.trigger()
    );

    // Determine if onboarding assistant should be visible
    const nextStep = nextRequiredStep || nextOptionalStep;
    const shouldShowOnboarding = !!nextStep;

    // Calculate progress
    const completedSteps = steps.filter(s => s.completed).length;
    const progress = Math.round((completedSteps / steps.length) * 100);

    const state = {
      user_id: user.id,
      package_type: packageType,
      should_show_onboarding: shouldShowOnboarding,
      next_step: nextStep || null,
      completed_steps: onboarding?.completed_steps || [],
      all_steps: steps,
      progress,
      data_status: {
        buildings: buildingCount,
        bank_accounts: bankAccountCount,
        contracts: contractCount,
        tasks: taskCount
      },
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