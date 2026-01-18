import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, entity_type, entity_id, metadata } = body;

    await base44.asServiceRole.entities.ActivityLog.create({
      user_email: user.email,
      action,
      entity_type,
      entity_id,
      metadata: JSON.stringify(metadata || {}),
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});