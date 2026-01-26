import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entityType, entityId, change } = await req.json();

    // Log to audit trail
    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: action, // CREATE, UPDATE, DELETE
      entity_type: entityType,
      entity_id: entityId,
      change_description: change,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date()
    });

    return Response.json({ 
      success: true,
      logId: auditLog.id
    });

  } catch (error) {
    console.error('Logging error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});