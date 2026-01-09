import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();
    const { sessionId } = data;

    // Get session
    const sessions = await base44.entities.TestSession.filter({ id: sessionId });
    
    if (sessions.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessions[0];

    // Calculate duration
    const startTime = new Date(session.session_start);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

    // Update session
    await base44.entities.TestSession.update(sessionId, {
      session_end: endTime.toISOString(),
      session_status: 'completed',
      total_duration_minutes: durationMinutes
    });

    // Update assignment if exists
    if (session.test_assignment_id) {
      const assignments = await base44.entities.TestAssignment.filter({ 
        id: session.test_assignment_id 
      });
      
      if (assignments.length > 0) {
        const assignment = assignments[0];
        await base44.entities.TestAssignment.update(assignment.id, {
          time_spent: (assignment.time_spent || 0) + durationMinutes
        });
      }
    }

    return Response.json({ 
      success: true, 
      duration: durationMinutes 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});