import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { test_phase_id } = body;

    console.log('Archiving test insights for phase:', test_phase_id);

    // Get test phase
    const phase = await base44.asServiceRole.entities.TestPhase.filter(
      { id: test_phase_id },
      null,
      1
    );

    if (!phase.length) {
      return Response.json({ error: 'Test phase not found' }, { status: 404 });
    }

    const testPhase = phase[0];

    // Get all test accounts for this phase
    const testAccounts = await base44.asServiceRole.entities.TestAccount.filter({
      is_active: true
    });

    // Aggregate journey patterns
    const journeys = await base44.asServiceRole.entities.UserJourney.filter({
      test_account_id: { $in: testAccounts.map(t => t.id) }
    });

    const journeyPatterns = {};
    journeys.forEach(j => {
      const pathKey = j.path_sequence.join(' -> ');
      journeyPatterns[pathKey] = (journeyPatterns[pathKey] || 0) + 1;
    });

    // Aggregate problems
    const problems = await base44.asServiceRole.entities.UserProblem.filter({
      created_date: { $gte: testPhase.start_date, $lte: testPhase.end_date }
    });

    const problemCategories = {};
    problems.forEach(p => {
      const cat = p.problem_type || 'unknown';
      if (!problemCategories[cat]) {
        problemCategories[cat] = { count: 0, examples: [] };
      }
      problemCategories[cat].count++;
      if (problemCategories[cat].examples.length < 3) {
        problemCategories[cat].examples.push(p.problem_titel);
      }
    });

    // Session statistics
    const sessionStats = {
      total_testers: testAccounts.length,
      avg_session_duration: 0,
      total_sessions: 0,
      problems_per_session: 0
    };

    if (testAccounts.length > 0) {
      const totalDuration = testAccounts.reduce((sum, t) => sum + (t.total_session_minutes || 0), 0);
      sessionStats.avg_session_duration = Math.round(totalDuration / testAccounts.length);
      sessionStats.total_sessions = testAccounts.reduce((sum, t) => sum + (t.total_sessions || 0), 0);
      sessionStats.problems_per_session = problems.length / Math.max(sessionStats.total_sessions, 1);
    }

    // Completion metrics
    const assignments = await base44.asServiceRole.entities.TestAssignment.filter({
      test_account_id: { $in: testAccounts.map(t => t.id) }
    });

    const completionMetrics = {
      total_assignments: assignments.length,
      completed_assignments: assignments.filter(a => a.status === 'completed').length,
      completion_rate: assignments.length > 0 ? Math.round((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100) : 0
    };

    // Generate recommendations
    const recommendations = [];
    if (completionMetrics.completion_rate < 70) {
      recommendations.push('Aufgaben sind zu komplex - Vereinfachung empfohlen');
    }
    if (problems.length > testAccounts.length * 2) {
      recommendations.push('Hohe Problem-Quote - UI-Review notwendig');
    }
    if (sessionStats.total_sessions < testAccounts.length / 2) {
      recommendations.push('Viele Tester haben nicht mehrfach getestet - Engagement verbesserbar');
    }

    // Create archived insights
    const insights = await base44.asServiceRole.entities.ArchivedInsights.create({
      test_phase_id,
      user_journey_patterns: journeyPatterns,
      problem_categories: problemCategories,
      session_statistics: sessionStats,
      completion_metrics: completionMetrics,
      valuable_feedback: `Phase '${testPhase.phase_name}' mit ${testAccounts.length} Testern und ${problems.length} Problem-Reports`,
      ux_recommendations: recommendations,
      archived_at: new Date().toISOString()
    });

    console.log('Insights archived:', insights.id);

    return Response.json({
      success: true,
      archive_id: insights.id,
      insights_summary: {
        total_problems: problems.length,
        completion_rate: completionMetrics.completion_rate,
        recommendations: recommendations.length,
        journey_patterns: Object.keys(journeyPatterns).length
      }
    });
  } catch (error) {
    console.error('Archive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});