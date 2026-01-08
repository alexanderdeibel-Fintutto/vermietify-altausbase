import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, event_type, details = {} } = await req.json();

    console.log('[AUDIT-LOG] Event:', event_type, 'Submission:', submission_id);

    // Audit-Event erstellen
    const auditEvent = await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: event_type,
      user_id: user.id,
      user_email: user.email,
      changes: JSON.stringify(details),
      timestamp: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return Response.json({ 
      success: true, 
      audit_id: auditEvent.id 
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});