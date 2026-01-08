import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { submission_id, event_type, details } = await req.json();

    console.log('[AUDIT-LOG]', event_type, 'for submission', submission_id);

    // ActivityLog verwenden für Audit-Trail
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: event_type,
      user_email: user?.email || 'system',
      details: details || {},
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});