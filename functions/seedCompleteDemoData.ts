import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Seeding complete demo data...');

    // Create test accounts
    const testAccounts = await base44.asServiceRole.entities.TestAccount.bulkCreate([
      {
        tester_id: user.id,
        tester_name: 'Demo Tester 1',
        test_email: 'tester1@demo.test',
        test_password: 'encrypted_password_1',
        simulated_role: 'user',
        package_level: 'professional',
        description: 'Standard Test Account',
        is_active: true,
        first_login: new Date(Date.now() - 7 * 86400000).toISOString(),
        last_login: new Date().toISOString(),
        total_sessions: 15,
        total_session_minutes: 480,
        pages_visited: 85,
        problems_reported: 8
      },
      {
        tester_id: user.id,
        tester_name: 'Demo Tester 2',
        test_email: 'tester2@demo.test',
        test_password: 'encrypted_password_2',
        simulated_role: 'user',
        package_level: 'basic',
        description: 'Budget Test Account',
        is_active: true,
        first_login: new Date(Date.now() - 5 * 86400000).toISOString(),
        last_login: new Date().toISOString(),
        total_sessions: 12,
        total_session_minutes: 320,
        pages_visited: 64,
        problems_reported: 5
      },
      {
        tester_id: user.id,
        tester_name: 'Demo Tester 3',
        test_email: 'tester3@demo.test',
        test_password: 'encrypted_password_3',
        simulated_role: 'admin',
        package_level: 'enterprise',
        description: 'Admin Test Account',
        is_active: true,
        first_login: new Date(Date.now() - 10 * 86400000).toISOString(),
        last_login: new Date(Date.now() - 1 * 86400000).toISOString(),
        total_sessions: 22,
        total_session_minutes: 720,
        pages_visited: 120,
        problems_reported: 12
      }
    ]);

    console.log('Created test accounts:', testAccounts.length);

    // Create test assignments
    const categories = ['Navigation', 'Forms', 'Payments', 'Reporting', 'Settings'];
    const assignments = [];
    for (let i = 0; i < 15; i++) {
      assignments.push({
        test_account_id: testAccounts[i % testAccounts.length].id,
        title: `Test Assignment ${i + 1}`,
        description: `Test basic functionality of ${categories[i % categories.length]} module`,
        category: categories[i % categories.length],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        estimated_duration: 30 + Math.random() * 90,
        status: i % 3 === 0 ? 'completed' : i % 2 === 0 ? 'in_progress' : 'assigned',
        started_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        completed_at: i % 3 === 0 ? new Date().toISOString() : null
      });
    }
    await base44.asServiceRole.entities.TestAssignment.bulkCreate(assignments);
    console.log('Created assignments:', assignments.length);

    // Create test sessions
    const sessions = [];
    for (let i = 0; i < 25; i++) {
      const startTime = new Date(Date.now() - Math.random() * 7 * 86400000);
      const endTime = new Date(startTime.getTime() + 30 * 60000 + Math.random() * 60 * 60000);
      sessions.push({
        test_account_id: testAccounts[i % testAccounts.length].id,
        session_id: `session_${Date.now()}_${i}`,
        started_at: startTime.toISOString(),
        ended_at: endTime.toISOString(),
        duration_minutes: (endTime - startTime) / 60000,
        status: 'completed',
        viewport_width: 1920,
        viewport_height: 1080,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      });
    }
    await base44.asServiceRole.entities.TestSession.bulkCreate(sessions);
    console.log('Created sessions:', sessions.length);

    // Create problem reports
    const problemTypes = ['functional_bug', 'ux_issue', 'performance', 'visual_bug', 'confusing'];
    const pageUrls = ['/dashboard', '/settings', '/profile', '/payments', '/reports', '/documents'];
    const problems = [];
    for (let i = 0; i < 20; i++) {
      problems.push({
        test_account_id: testAccounts[i % testAccounts.length].id,
        problem_title: `Issue: ${['Button not clickable', 'Form validation broken', 'Slow loading', 'Wrong color', 'Confusing layout'][i % 5]}`,
        problem_description: 'This is a detailed description of the problem encountered during testing',
        problem_type: problemTypes[i % problemTypes.length],
        functional_severity: ['minor_bug', 'workflow_impacting', 'feature_blocking'][Math.floor(Math.random() * 3)],
        page_url: pageUrls[i % pageUrls.length],
        page_title: `Page ${i}`,
        status: i % 4 === 0 ? 'resolved' : i % 3 === 0 ? 'in_progress' : 'open',
        created_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
      });
    }
    await base44.asServiceRole.entities.UserProblem.bulkCreate(problems);
    console.log('Created problems:', problems.length);

    // Create UX patterns
    const patterns = [];
    for (let i = 0; i < 5; i++) {
      patterns.push({
        pattern_type: ['user_journey', 'click_pattern', 'dropout_pattern', 'success_pattern', 'error_pattern'][i],
        pattern_name: `Pattern ${i + 1}: ${['Dashboard → Settings', 'Form abandonment', 'Payment flow', 'Search usage', 'Error recovery'][i]}`,
        description: 'Detected UX pattern from user interactions',
        affected_pages: pageUrls.slice(0, 2 + Math.floor(Math.random() * 3)),
        frequency: 10 + Math.random() * 40,
        frequency_percentage: 15 + Math.random() * 50,
        user_count: 5 + Math.floor(Math.random() * 15),
        impact_score: Math.random() * 100,
        sentiment_analysis: {
          sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
          confidence: 0.7 + Math.random() * 0.3,
          keywords: ['slow', 'confusing', 'intuitive', 'broken', 'helpful']
        },
        ai_insights: 'AI-generated insight about this pattern',
        recommendations: ['Improve UX', 'Simplify flow', 'Add help text'],
        detected_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
      });
    }
    await base44.asServiceRole.entities.UXPattern.bulkCreate(patterns);
    console.log('Created patterns:', patterns.length);

    // Create AI insights
    const insights = [];
    for (let i = 0; i < 8; i++) {
      insights.push({
        insight_type: ['pattern_analysis', 'sentiment_analysis', 'anomaly_detection', 'conversion_prediction', 'improvement_suggestion'][i % 5],
        title: `Insight ${i + 1}: ${['High dropout rate detected', 'Negative sentiment cluster', 'Unusual traffic pattern', 'Predicted 23% conversion lift', 'Quick wins identified'][i % 5]}`,
        description: 'Detailed AI-generated insight',
        ai_analysis: 'Based on analysis of 50+ user sessions, we detected...',
        confidence_score: 65 + Math.random() * 35,
        affected_metrics: {
          conversion_rate: { current: 0.15, predicted: 0.18 },
          bounce_rate: { current: 0.35, predicted: 0.28 }
        },
        recommendation: 'Consider implementing feature X to improve metric Y',
        priority: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
        actionable: Math.random() > 0.5,
        generated_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
      });
    }
    await base44.asServiceRole.entities.AIInsight.bulkCreate(insights);
    console.log('Created insights:', insights.length);

    // Create test analytics
    const analytics = await base44.asServiceRole.entities.TesterAnalytics.create({
      date: new Date().toISOString().split('T')[0],
      total_testers: testAccounts.length,
      active_sessions: 5,
      completed_assignments: 12,
      problems_reported: problems.length,
      avg_session_duration: 45,
      top_problem_pages: pageUrls.slice(0, 3),
      completion_rate: 72,
      bounce_rate: 28,
      time_period: 'daily'
    });
    console.log('Created analytics');

    return Response.json({
      success: true,
      data_created: {
        test_accounts: testAccounts.length,
        assignments: assignments.length,
        sessions: sessions.length,
        problems: problems.length,
        patterns: patterns.length,
        insights: insights.length,
        analytics: 1
      },
      total_records: testAccounts.length + assignments.length + sessions.length + problems.length + patterns.length + insights.length + 1
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});