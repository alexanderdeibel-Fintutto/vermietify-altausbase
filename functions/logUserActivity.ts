import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const { actionType, resource, resourceId, details, duration } = await req.json();
    
    await base44.entities.UserActivity.create({
      user_id: user.id,
      action_type: actionType,
      resource: resource || 'unknown',
      resource_id: resourceId || null,
      details: details || {},
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      session_id: null,
      duration: duration || null
    });
    
    // Last activity aktualisieren
    await base44.asServiceRole.entities.User.update(user.id, {
      last_activity: new Date().toISOString()
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error("Log user activity error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});