import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, metric_type, value, metadata } = await req.json();

    console.log(`[PERF-TRACK] ${metric_type}: ${value}`);

    // Speichere Performance-Metrik
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'performance_metric',
      details: {
        metric_type,
        value,
        metadata,
        timestamp: new Date().toISOString()
      },
      performed_by: user.email
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});