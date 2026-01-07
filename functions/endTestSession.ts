import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { sessionId, feedback } = await req.json();
    
    if (!user || !user.is_tester) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }
    
    // Session laden
    const sessions = await base44.entities.TestSession.filter({ id: sessionId });
    if (sessions.length === 0 || sessions[0].user_id !== user.id) {
      return Response.json({ error: "Invalid session" }, { status: 400 });
    }
    
    const session = sessions[0];
    const sessionEnd = new Date();
    const sessionStart = new Date(session.session_start);
    const totalDuration = Math.round((sessionEnd - sessionStart) / 60000); // Minuten
    
    await base44.entities.TestSession.update(sessionId, {
      session_end: sessionEnd.toISOString(),
      total_duration: totalDuration,
      feedback_rating: feedback?.rating || null,
      notes: feedback?.notes || ""
    });
    
    return Response.json({ 
      success: true,
      duration: totalDuration,
      message: "Test session ended" 
    });
    
  } catch (error) {
    console.error("End test session error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});