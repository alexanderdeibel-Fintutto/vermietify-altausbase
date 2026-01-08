import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, event_type, details, metadata } = await req.json();

    console.log(`[AUDIT] Logging event: ${event_type} for submission ${submission_id}`);

    // Erstelle Audit-Log-Eintrag
    const auditLog = await base44.entities.ActivityLog.create({
      user_id: user.id,
      user_email: user.email,
      action: `ELSTER_${event_type}`,
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      details: details || `${event_type} ausgeführt`,
      metadata: {
        ...metadata,
        submission_id,
        event_type,
        timestamp: new Date().toISOString()
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

    console.log(`[SUCCESS] Audit log created: ${auditLog.id}`);

    return Response.json({
      success: true,
      audit_log_id: auditLog.id
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});