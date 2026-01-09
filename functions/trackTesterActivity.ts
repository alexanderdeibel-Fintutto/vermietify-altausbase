import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      test_account_id,
      session_id,
      activity_type,
      page_url,
      page_title,
      element_selector,
      element_text,
      element_type,
      problem_report_id,
      error_message,
      duration_seconds,
      viewport_width,
      viewport_height,
      metadata
    } = await req.json();

    if (!test_account_id || !activity_type) {
      return Response.json({ error: 'test_account_id und activity_type erforderlich' }, { status: 400 });
    }

    // Aktivität in DB speichern
    const activity = await base44.asServiceRole.entities.TesterActivity.create({
      test_account_id,
      session_id: session_id || generateSessionId(),
      activity_type,
      timestamp: new Date().toISOString(),
      page_url: page_url || null,
      page_title: page_title || null,
      element_selector: element_selector || null,
      element_text: element_text || null,
      element_type: element_type || null,
      problem_report_id: problem_report_id || null,
      error_message: error_message || null,
      duration_seconds: duration_seconds || null,
      viewport_width: viewport_width || null,
      viewport_height: viewport_height || null,
      user_agent: req.headers.get('user-agent') || null,
      metadata: metadata || {}
    });

    // TestAccount-Statistiken aktualisieren
    if (test_account_id) {
      const testAccount = (await base44.asServiceRole.entities.TestAccount.list('', 1, { id: test_account_id }))[0];
      
      if (testAccount) {
        let updateData = {
          last_activity: new Date().toISOString()
        };

        if (activity_type === 'page_visit') {
          updateData.pages_visited = (testAccount.pages_visited || 0) + 1;
        } else if (activity_type === 'problem_report') {
          updateData.problems_reported = (testAccount.problems_reported || 0) + 1;
        }

        await base44.asServiceRole.entities.TestAccount.update(test_account_id, updateData);
      }
    }

    return Response.json({
      success: true,
      activity_id: activity.id,
      timestamp: activity.timestamp
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}