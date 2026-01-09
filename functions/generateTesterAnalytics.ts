import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { start_date, end_date, tester_ids } = body;

    console.log('Analytics generation started:', { start_date, end_date, tester_count: tester_ids?.length });

    // Fetch test accounts
    const testAccounts = tester_ids
      ? await base44.asServiceRole.entities.TestAccount.filter({ tester_id: { $in: tester_ids } })
      : await base44.asServiceRole.entities.TestAccount.list('-created_date', 100);

    console.log('Found test accounts:', testAccounts.length);

    // Fetch all activities in date range
    const activities = await base44.asServiceRole.entities.TesterActivity.filter({
      test_account_id: { $in: testAccounts.map(t => t.id) },
      timestamp: { $gte: start_date, $lte: end_date }
    }, '-timestamp', 1000);

    console.log('Found activities:', activities.length);

    // Fetch problems
    const problems = await base44.asServiceRole.entities.UserProblem.filter({
      test_account_id: { $in: testAccounts.map(t => t.id) },
      created_date: { $gte: start_date, $lte: end_date }
    }, '-created_date', 1000);

    console.log('Found problems:', problems.length);

    // Calculate analytics
    const pageVisits = activities.filter(a => a.activity_type === 'page_visit');
    const clicks = activities.filter(a => a.activity_type === 'click');
    
    const avgSessionDuration = pageVisits.length > 0
      ? pageVisits.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / pageVisits.length
      : 0;

    // Problem distribution by page
    const problemsByPage = {};
    problems.forEach(p => {
      const page = p.page_url || 'unknown';
      if (!problemsByPage[page]) {
        problemsByPage[page] = {
          page_url: page,
          page_title: p.page_title || page,
          count: 0,
          severity: 0,
          problems: []
        };
      }
      problemsByPage[page].count++;
      problemsByPage[page].severity += (p.functional_severity === 'app_breaking' ? 10 : 
                                        p.functional_severity === 'feature_blocking' ? 7 : 5);
      problemsByPage[page].problems.push(p.problem_titel);
    });

    const topProblems = Object.values(problemsByPage)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(p => ({
        ...p,
        avg_severity: p.severity / p.count
      }));

    // Heatmap - count clicks per page
    const heatmapData = {};
    clicks.forEach(c => {
      const page = c.page_url || 'unknown';
      if (!heatmapData[page]) heatmapData[page] = 0;
      heatmapData[page]++;
    });

    // Completion rates
    const assignments = await base44.asServiceRole.entities.TestAssignment.filter({
      test_account_id: { $in: testAccounts.map(t => t.id) }
    });

    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const completionRate = assignments.length > 0 ? Math.round((completedAssignments / assignments.length) * 100) : 0;

    const analytics = {
      date: new Date().toISOString().split('T')[0],
      total_testers: testAccounts.length,
      active_sessions: testAccounts.filter(t => t.last_activity && new Date(t.last_activity) > new Date(Date.now() - 30 * 60000)).length,
      completed_assignments: completedAssignments,
      problems_reported: problems.length,
      avg_session_duration: Math.round(avgSessionDuration),
      top_problem_pages: topProblems,
      heatmap_data: heatmapData,
      completion_rate: completionRate,
      bounce_rate: pageVisits.length > 0 ? Math.round((pageVisits.filter(p => !p.duration_seconds || p.duration_seconds < 10).length / pageVisits.length) * 100) : 0,
      time_period: 'daily'
    };

    // Save analytics
    const saved = await base44.asServiceRole.entities.TesterAnalytics.create(analytics);

    console.log('Analytics saved:', saved.id);

    return Response.json({ success: true, analytics: saved });
  } catch (error) {
    console.error('Analytics generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});