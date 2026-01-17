import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, entity_type, entity_id, details } = body;

    await base44.entities.AuditLog.create({
      user_id: user.id,
      action,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      details: details || null,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});