import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create onboarding record
    let onboardingData = await base44.entities.UserOnboarding.filter({ user_id: user.id });
    
    if (onboardingData.length === 0) {
      const created = await base44.entities.UserOnboarding.create({
        user_id: user.id,
        completed_steps: [],
        onboarding_progress: 0,
        feature_usage: {},
        data_quality_score: 0,
        days_since_signup: 0,
        user_level: 'beginner',
        last_activity: new Date().toISOString()
      });
      onboardingData = [created];
    }

    const onboarding = onboardingData[0];

    // Calculate days since signup
    const signupDate = new Date(user.created_date);
    const daysSinceSignup = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

    // Fetch data to calculate completeness
    const [buildings, units, tenants, contracts, invoices, bankAccounts, documents] = await Promise.all([
      base44.entities.Building.list(),
      base44.entities.Unit.list(),
      base44.entities.Tenant.list(),
      base44.entities.LeaseContract.list(),
      base44.entities.Invoice.list(),
      base44.entities.BankAccount.list(),
      base44.entities.Document.list()
    ]);

    // Calculate data quality score (0-100)
    const dataPoints = [
      buildings.length > 0 ? 15 : 0,
      units.length > 0 ? 10 : 0,
      tenants.length > 0 ? 15 : 0,
      contracts.length > 0 ? 20 : 0,
      invoices.length > 0 ? 15 : 0,
      bankAccounts.length > 0 ? 15 : 0,
      documents.length > 0 ? 10 : 0
    ];
    const dataQualityScore = dataPoints.reduce((a, b) => a + b, 0);

    // Determine user level
    let userLevel = 'beginner';
    if (daysSinceSignup > 90 && dataQualityScore > 70) userLevel = 'expert';
    else if (daysSinceSignup > 30 && dataQualityScore > 50) userLevel = 'advanced';
    else if (daysSinceSignup > 7 && dataQualityScore > 30) userLevel = 'intermediate';

    // Calculate onboarding progress
    const totalSteps = 7;
    const completedSteps = [
      buildings.length > 0,
      units.length > 0,
      tenants.length > 0,
      contracts.length > 0,
      invoices.length > 0,
      bankAccounts.length > 0,
      documents.length > 0
    ].filter(Boolean).length;
    const onboardingProgress = Math.round((completedSteps / totalSteps) * 100);

    // Update onboarding record
    await base44.entities.UserOnboarding.update(onboarding.id, {
      days_since_signup: daysSinceSignup,
      data_quality_score: dataQualityScore,
      user_level: userLevel,
      onboarding_progress: onboardingProgress,
      last_activity: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      daysSinceSignup,
      dataQualityScore,
      userLevel,
      onboardingProgress
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});