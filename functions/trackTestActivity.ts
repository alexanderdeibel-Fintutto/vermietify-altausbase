import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { sessionId, activityType, activityData } = await req.json();
    
    if (!user || !user.is_tester) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }
    
    // Session laden
    const sessions = await base44.entities.TestSession.filter({ id: sessionId });
    if (sessions.length === 0 || sessions[0].user_id !== user.id) {
      return Response.json({ error: "Invalid session" }, { status: 400 });
    }
    
    const session = sessions[0];
    const updatedData = {};
    
    switch(activityType) {
      case 'page_visit':
        updatedData.pages_visited = [
          ...(session.pages_visited || []),
          {
            page: activityData.page,
            timestamp: new Date().toISOString(),
            duration: activityData.duration
          }
        ];
        break;
        
      case 'action':
        updatedData.actions_performed = [
          ...(session.actions_performed || []),
          {
            type: activityData.type,
            target: activityData.target,
            timestamp: new Date().toISOString()
          }
        ];
        break;
        
      case 'feature_test':
        const existingFeatures = session.features_tested || [];
        if (!existingFeatures.includes(activityData.feature)) {
          updatedData.features_tested = [...existingFeatures, activityData.feature];
        }
        break;
    }
    
    if (Object.keys(updatedData).length > 0) {
      await base44.entities.TestSession.update(sessionId, updatedData);
    }
    
    // User-Activity loggen
    await base44.entities.UserActivity.create({
      user_id: user.id,
      action_type: activityType,
      resource: activityData.resource || 'testing',
      resource_id: activityData.resourceId || null,
      details: activityData,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      session_id: sessionId
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error("Track test activity error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});