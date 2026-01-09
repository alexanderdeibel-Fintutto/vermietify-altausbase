import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { test_account_id } = body;

    if (!test_account_id) {
      return Response.json({ success: false, error: 'test_account_id erforderlich' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create TestSession record
    const session = await base44.asServiceRole.entities.TestSession.create({
      test_account_id,
      session_id: sessionId,
      started_at: new Date().toISOString(),
      status: 'active',
      viewport_width: 1024,
      viewport_height: 768,
      user_agent: 'tester-agent',
      is_active: true
    });

    // Log initial activity
    await base44.asServiceRole.entities.TesterActivity.create({
      test_account_id,
      session_id: sessionId,
      activity_type: 'login',
      timestamp: new Date().toISOString(),
      page_url: '/',
      page_title: 'Dashboard',
      viewport_width: 1024,
      viewport_height: 768,
      metadata: {
        session_start: true
      }
    });

    // Update TestAccount
    await base44.asServiceRole.entities.TestAccount.update(test_account_id, {
      first_login: new Date().toISOString(),
      last_login: new Date().toISOString(),
      total_sessions: (await base44.asServiceRole.entities.TestSession.filter({ test_account_id })).length
    });

    return Response.json({
      success: true,
      session_id: sessionId,
      started_at: new Date().toISOString(),
      test_account_id
    });
  } catch (error) {
    console.error('Start session error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});