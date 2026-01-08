import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id, activity_type, data } = await req.json();

    // Session laden
    const sessions = await base44.asServiceRole.entities.TestSession.filter({ id: session_id });
    if (sessions.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }
    const session = sessions[0];

    const updates = {};

    switch(activity_type) {
      case 'page_visit':
        updates.pages_visited = [...(session.pages_visited || []), {
          url: data.url,
          title: data.title,
          timestamp: new Date().toISOString()
        }];
        break;
      
      case 'action':
        updates.actions_performed = [...(session.actions_performed || []), {
          type: data.type,
          element: data.element,
          timestamp: new Date().toISOString()
        }];
        break;
      
      case 'feature_tested':
        const features = session.features_tested || [];
        if (!features.includes(data.feature)) {
          updates.features_tested = [...features, data.feature];
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.TestSession.update(session_id, updates);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error tracking activity:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});