import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, event_type, event_data, notes } = await req.json();

    if (!submission_id || !event_type) {
      return Response.json({ error: 'submission_id and event_type required' }, { status: 400 });
    }

    const auditEvent = {
      submission_id,
      event_type,
      event_data: event_data || {},
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      timestamp: new Date().toISOString(),
      notes: notes || null
    };

    // Log to ActivityLog
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: event_type,
      user_id: user.id,
      changes: event_data,
      metadata: {
        audit_trail: true,
        notes
      }
    });

    console.log(`[AUDIT] ${event_type} by ${user.email} on submission ${submission_id}`);

    return Response.json({
      success: true,
      audit_event: auditEvent
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});