import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { sessionId, feedback, feedbackRating, notes } = await req.json();
    
    if (!sessionId) {
      return Response.json({ error: "sessionId required" }, { status: 400 });
    }
    
    const sessions = await base44.asServiceRole.entities.TestSession.filter({ id: sessionId });
    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    
    const session = sessions[0];
    const sessionStart = new Date(session.session_start);
    const sessionEnd = new Date();
    const totalDuration = Math.round((sessionEnd - sessionStart) / 1000 / 60); // in Minuten
    
    await base44.asServiceRole.entities.TestSession.update(sessionId, {
      session_end: sessionEnd.toISOString(),
      total_duration: totalDuration,
      notes: notes || session.notes,
      feedback_rating: feedbackRating || session.feedback_rating
    });
    
    return Response.json({
      success: true,
      duration: totalDuration
    });
    
  } catch (error) {
    console.error("End test session error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});