import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [navigationStates, featureUnlocks, onboardingData, users] = await Promise.all([
      base44.asServiceRole.entities.NavigationState.list(),
      base44.asServiceRole.entities.FeatureUnlock.list(),
      base44.asServiceRole.entities.UserOnboarding.list(),
      base44.asServiceRole.entities.User.list()
    ]);

    // Calculate comprehensive analytics
    const analytics = {
      overview: {
        totalUsers: users.length,
        usersWithNavigation: navigationStates.length,
        totalUnlocks: featureUnlocks.length,
        avgUnlocksPerUser: navigationStates.length > 0 ? (featureUnlocks.length / navigationStates.length).toFixed(2) : 0
      },
      unlockDistribution: {},
      unlockReasons: {
        time_based: 0,
        data_based: 0,
        usage_based: 0,
        package_based: 0
      },
      userLevels: {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0
      },
      onboardingMetrics: {
        avgProgress: 0,
        avgDataQualityScore: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0
      },
      featureVisibility: {},
      recentActivity: {
        last24h: 0,
        last7d: 0,
        last30d: 0
      }
    };

    // Analyze feature unlocks
    featureUnlocks.forEach(unlock => {
      analytics.unlockDistribution[unlock.feature_key] = (analytics.unlockDistribution[unlock.feature_key] || 0) + 1;
      analytics.unlockReasons[unlock.unlock_reason]++;

      const unlockDate = new Date(unlock.created_date);
      const now = new Date();
      const hoursDiff = (now - unlockDate) / (1000 * 60 * 60);
      
      if (hoursDiff <= 24) analytics.recentActivity.last24h++;
      if (hoursDiff <= 168) analytics.recentActivity.last7d++;
      if (hoursDiff <= 720) analytics.recentActivity.last30d++;
    });

    // Analyze user levels
    onboardingData.forEach(data => {
      analytics.userLevels[data.user_level || 'beginner']++;
      analytics.onboardingMetrics.avgProgress += data.onboarding_progress || 0;
      analytics.onboardingMetrics.avgDataQualityScore += data.data_quality_score || 0;

      if (data.onboarding_progress >= 100) analytics.onboardingMetrics.completed++;
      else if (data.onboarding_progress > 0) analytics.onboardingMetrics.inProgress++;
      else analytics.onboardingMetrics.notStarted++;
    });

    if (onboardingData.length > 0) {
      analytics.onboardingMetrics.avgProgress = Math.round(analytics.onboardingMetrics.avgProgress / onboardingData.length);
      analytics.onboardingMetrics.avgDataQualityScore = Math.round(analytics.onboardingMetrics.avgDataQualityScore / onboardingData.length);
    }

    // Analyze feature visibility
    navigationStates.forEach(state => {
      (state.visible_features || []).forEach(feature => {
        analytics.featureVisibility[feature] = (analytics.featureVisibility[feature] || 0) + 1;
      });
    });

    // Sort distributions
    analytics.unlockDistribution = Object.fromEntries(
      Object.entries(analytics.unlockDistribution).sort((a, b) => b[1] - a[1])
    );
    analytics.featureVisibility = Object.fromEntries(
      Object.entries(analytics.featureVisibility).sort((a, b) => b[1] - a[1])
    );

    return Response.json({ analytics });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});