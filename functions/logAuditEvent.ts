import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entityType, entityId, oldValue, newValue, changeSummary, reason } = await req.json();

    const log = await base44.entities.AuditLog?.create?.({
      user_email: user.email,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
      change_summary: changeSummary,
      reason: reason,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString()
    });

    return Response.json({ data: { logged: true, log_id: log?.id } });
  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});