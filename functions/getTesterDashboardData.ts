import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { test_account_id } = await req.json();

    if (!test_account_id) {
      return Response.json({ error: 'Missing test_account_id' }, { status: 400 });
    }

    // Fetch test account
    const testAccount = await base44.asServiceRole.entities.TestAccount.read(test_account_id);

    // Fetch active session
    const sessions = await base44.asServiceRole.entities.TestSession.filter(
      { test_account_id, status: 'active' },
      '-started_at',
      1
    );
    const activeSession = sessions[0];

    // Fetch assignments, problems, activities with limits to prevent rate limiting
    const [assignments, problems, activities] = await Promise.all([
      base44.asServiceRole.entities.TestAssignment.filter(
        { test_account_id },
        '-created_date',
        5
      ).catch(() => []),
      base44.asServiceRole.entities.UserProblem.filter(
        { test_account_id },
        '-created_date',
        5
      ).catch(() => []),
      base44.asServiceRole.entities.TesterActivity.filter(
        { test_account_id },
        '-timestamp',
        10
      ).catch(() => [])
    ]);

    // Calculate completion percentage
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const completionPercentage = assignments.length > 0 ? Math.round((completedAssignments / assignments.length) * 100) : 0;

    // Calculate session stats
    const sessionStats = {
      pages_visited: testAccount.pages_visited || 0,
      problems_reported: testAccount.problems_reported || 0,
      total_sessions: testAccount.total_sessions || 0,
      total_minutes: testAccount.total_session_minutes || 0,
      last_activity: testAccount.last_activity,
      session_started: activeSession?.started_at || null
    };

    return Response.json({
      success: true,
      test_account: {
        id: testAccount.id,
        tester_name: testAccount.tester_name,
        simulated_role: testAccount.simulated_role
      },
      session_stats: sessionStats,
      assignments,
      problems,
      activities,
      completion_percentage: completionPercentage,
      active_session: activeSession ? {
        id: activeSession.id,
        session_id: activeSession.session_id,
        started_at: activeSession.started_at
      } : null
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});