import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();
    const { assignmentId } = data;

    // Create test session
    const session = await base44.entities.TestSession.create({
      tester_id: user.id,
      test_assignment_id: assignmentId,
      session_start: new Date().toISOString(),
      session_status: 'active',
      browser_info: {
        userAgent: req.headers.get('user-agent')
      }
    });

    // Update assignment status
    if (assignmentId) {
      await base44.entities.TestAssignment.update(assignmentId, {
        status: 'in_progress',
        started_at: new Date().toISOString()
      });
    }

    return Response.json({ 
      success: true, 
      sessionId: session.id 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});