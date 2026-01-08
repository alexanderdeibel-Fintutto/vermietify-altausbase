import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_account_id, assignment_id } = await req.json();

    // Session erstellen
    const session = await base44.asServiceRole.entities.TestSession.create({
      user_id: user.id,
      test_account_id: test_account_id,
      assignment_id: assignment_id,
      session_start: new Date().toISOString(),
      pages_visited: [],
      actions_performed: [],
      features_tested: [],
      browser_info: ''
    });

    // Assignment-Status aktualisieren falls vorhanden
    if (assignment_id) {
      await base44.asServiceRole.entities.TestAssignment.update(assignment_id, {
        status: 'in_progress',
        started_at: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      session_id: session.id,
      message: 'Test-Session gestartet'
    });

  } catch (error) {
    console.error('Error starting test session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});