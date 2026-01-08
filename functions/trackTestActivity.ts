import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { sessionId, activityType, activityData } = await req.json();
    
    if (!sessionId || !activityType) {
      return Response.json({ error: "sessionId and activityType required" }, { status: 400 });
    }
    
    const sessions = await base44.asServiceRole.entities.TestSession.filter({ id: sessionId });
    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    
    const session = sessions[0];
    
    if (activityType === 'page_visit') {
      const pagesVisited = session.pages_visited || [];
      pagesVisited.push({
        page: activityData.page,
        timestamp: new Date().toISOString(),
        duration: activityData.duration
      });
      
      await base44.asServiceRole.entities.TestSession.update(sessionId, {
        pages_visited: pagesVisited
      });
    }
    
    if (activityType === 'action') {
      const actionsPerformed = session.actions_performed || [];
      actionsPerformed.push({
        type: activityData.type,
        target: activityData.target,
        resource: activityData.resource,
        resourceId: activityData.resourceId,
        timestamp: new Date().toISOString()
      });
      
      await base44.asServiceRole.entities.TestSession.update(sessionId, {
        actions_performed: actionsPerformed
      });
    }
    
    if (activityType === 'feature_test') {
      const featuresTested = session.features_tested || [];
      if (!featuresTested.includes(activityData.feature)) {
        featuresTested.push(activityData.feature);
        
        await base44.asServiceRole.entities.TestSession.update(sessionId, {
          features_tested: featuresTested
        });
      }
    }
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error("Track test activity error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});