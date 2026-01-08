import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = await base44.asServiceRole.entities.TestSession.create({
      user_id: user.id,
      session_start: new Date().toISOString(),
      session_end: null,
      total_duration: 0,
      pages_visited: [],
      actions_performed: [],
      features_tested: [],
      browser_info: req.headers.get('user-agent') || 'unknown',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return Response.json({
      success: true,
      sessionId: session.id
    });
    
  } catch (error) {
    console.error("Start test session error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});