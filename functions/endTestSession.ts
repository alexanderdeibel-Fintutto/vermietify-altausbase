import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { test_account_id, duration_minutes, session_id } = body;

    if (!test_account_id) {
      return Response.json({ success: false, error: 'test_account_id erforderlich' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get active session
    const sessions = await base44.asServiceRole.entities.TestSession.filter({
      test_account_id,
      status: 'active'
    });

    if (!sessions || sessions.length === 0) {
      return Response.json({ success: false, error: 'Keine aktive Session gefunden' }, { status: 404 });
    }

    const activeSession = sessions[0];

    // Calculate actual duration
    const startedAt = new Date(activeSession.started_at);
    const actualDurationMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000);

    // Log logout activity
    await base44.asServiceRole.entities.TesterActivity.create({
      test_account_id,
      session_id: activeSession.session_id,
      activity_type: 'logout',
      timestamp: new Date().toISOString(),
      page_url: '/',
      page_title: 'Dashboard',
      metadata: {
        session_end: true,
        duration_minutes: actualDurationMinutes
      }
    });

    // Update session
    await base44.asServiceRole.entities.TestSession.update(activeSession.id, {
      ended_at: new Date().toISOString(),
      status: 'completed',
      is_active: false,
      duration_minutes: actualDurationMinutes
    });

    // Get activity count for this session
    const activities = await base44.asServiceRole.entities.TesterActivity.filter({
      session_id: activeSession.session_id
    });

    // Update TestAccount stats
    const testAccount = await base44.asServiceRole.entities.TestAccount.list();
    const myAccount = testAccount.find(acc => acc.id === test_account_id);

    const totalSessions = (await base44.asServiceRole.entities.TestSession.filter({ 
      test_account_id,
      status: 'completed'
    })).length;

    const pageVisits = (await base44.asServiceRole.entities.TesterActivity.filter({
      test_account_id,
      activity_type: 'page_visit'
    })).length;

    const problemReports = (await base44.asServiceRole.entities.TesterActivity.filter({
      test_account_id,
      activity_type: 'problem_report'
    })).length;

    await base44.asServiceRole.entities.TestAccount.update(test_account_id, {
      last_activity: new Date().toISOString(),
      last_login: new Date().toISOString(),
      total_sessions: totalSessions,
      total_session_minutes: (myAccount?.total_session_minutes || 0) + actualDurationMinutes,
      pages_visited: pageVisits,
      problems_reported: problemReports
    });

    return Response.json({
      success: true,
      session_id: activeSession.session_id,
      duration_minutes: actualDurationMinutes,
      activity_count: activities.length,
      ended_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('End session error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});