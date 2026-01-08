import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id, feedback_rating, notes } = await req.json();

    // Session laden
    const sessions = await base44.asServiceRole.entities.TestSession.filter({ id: session_id });
    if (sessions.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }
    const session = sessions[0];

    const endTime = new Date();
    const startTime = new Date(session.session_start);
    const duration = Math.round((endTime - startTime) / 60000); // Minuten

    // Session beenden
    await base44.asServiceRole.entities.TestSession.update(session_id, {
      session_end: endTime.toISOString(),
      total_duration: duration,
      feedback_rating: feedback_rating,
      notes: notes
    });

    // Assignment aktualisieren falls vorhanden
    if (session.assignment_id) {
      const assignments = await base44.asServiceRole.entities.TestAssignment.filter({ id: session.assignment_id });
      if (assignments.length > 0) {
        const assignment = assignments[0];
        await base44.asServiceRole.entities.TestAssignment.update(session.assignment_id, {
          status: 'testing_complete',
          completed_at: endTime.toISOString(),
          time_spent: (assignment.time_spent || 0) + duration,
          feedback: notes
        });
      }
    }

    return Response.json({
      success: true,
      duration: duration,
      message: 'Test-Session beendet'
    });

  } catch (error) {
    console.error('Error ending test session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});