import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { test_account_id, activity_type, page_url, page_title, element_data, form_data, viewport_width, viewport_height, time_spent_seconds } = await req.json();

    if (!test_account_id || !activity_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current session ID or create new one
    const sessions = await base44.asServiceRole.entities.TestSession.filter(
      { test_account_id, status: 'active' },
      '-started_at',
      1
    );
    const session_id = sessions[0]?.session_id || `session_${Date.now()}`;

    // Create activity record
    const activity = await base44.asServiceRole.entities.TesterActivity.create({
      test_account_id,
      session_id,
      activity_type,
      timestamp: new Date().toISOString(),
      page_url: page_url || window?.location?.href,
      page_title: page_title || document?.title,
      element_selector: element_data?.selector,
      element_text: element_data?.text?.slice(0, 200),
      element_type: element_data?.type,
      viewport_width,
      viewport_height,
      user_agent: req.headers.get('user-agent'),
      duration_seconds: time_spent_seconds,
      metadata: {
        form_fields: form_data ? Object.keys(form_data) : []
      }
    });

    // Update TestAccount stats
    const testAccount = await base44.asServiceRole.entities.TestAccount.read(test_account_id);
    const updates = {
      last_activity: new Date().toISOString()
    };

    if (activity_type === 'page_visit') {
      updates.pages_visited = (testAccount.pages_visited || 0) + 1;
    } else if (activity_type === 'problem_report') {
      updates.problems_reported = (testAccount.problems_reported || 0) + 1;
    }

    await base44.asServiceRole.entities.TestAccount.update(test_account_id, updates);

    return Response.json({ success: true, activity_id: activity.id });
  } catch (error) {
    console.error('Activity tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});