import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Scheduled task to generate AI insights, patterns and A/B test recommendations in background
 * Runs every 6 hours instead of on-demand
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    console.log('Starting scheduled AI analytics generation...');

    // Step 1: Analyze UX patterns
    console.log('Step 1: Analyzing UX patterns...');
    const patternsRes = await base44.functions.invoke('analyzeUXPatterns', {
      min_frequency: 2
    });
    console.log('✓ Patterns generated:', patternsRes.data?.patterns_found);

    // Step 2: Generate AI insights
    console.log('Step 2: Generating AI insights...');
    const insightsRes = await base44.functions.invoke('generateAIInsights', {
      patterns: patternsRes.data?.patterns || [],
      analytics_data: {}
    });
    console.log('✓ Insights generated:', insightsRes.data?.insights_generated);

    // Step 3: Generate A/B test recommendations
    console.log('Step 3: Generating A/B test recommendations...');
    const abTestsRes = await base44.functions.invoke('generateABTestRecommendations', {
      insights: insightsRes.data?.insights || [],
      user_segments: []
    });
    console.log('✓ A/B tests generated:', abTestsRes.data?.ab_test_recommendations);

    // Log completion
    await base44.entities.ActivityLog?.create?.({
      action: 'scheduled_ai_generation',
      status: 'completed',
      details: {
        patterns: patternsRes.data?.patterns_found,
        insights: insightsRes.data?.insights_generated,
        ab_tests: abTestsRes.data?.ab_test_recommendations
      },
      timestamp: new Date().toISOString()
    }).catch(() => {}); // Ignore if ActivityLog not available

    return Response.json({
      success: true,
      summary: {
        patterns_found: patternsRes.data?.patterns_found,
        insights_generated: insightsRes.data?.insights_generated,
        ab_test_recommendations: abTestsRes.data?.ab_test_recommendations,
        completed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Scheduled analytics generation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});