import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !user.is_tester) {
      return Response.json({ error: "Not authorized for testing" }, { status: 403 });
    }
    
    // Aktive Session prüfen
    const activeSessions = await base44.entities.TestSession.filter({
      user_id: user.id,
      session_end: null
    });
    
    if (activeSessions.length > 0) {
      return Response.json({ 
        sessionId: activeSessions[0].id,
        message: "Session already active" 
      });
    }
    
    // Neue Session starten
    const session = await base44.entities.TestSession.create({
      user_id: user.id,
      session_start: new Date().toISOString(),
      pages_visited: [],
      actions_performed: [],
      features_tested: [],
      browser_info: req.headers.get('user-agent') || 'unknown',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    });
    
    return Response.json({ 
      sessionId: session.id,
      message: "Test session started" 
    });
    
  } catch (error) {
    console.error("Start test session error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});