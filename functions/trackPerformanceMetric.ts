import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { metric_name, value, metadata } = await req.json();

    console.log(`[METRIC] ${metric_name}: ${value}`);

    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterPerformance',
      action: 'metric_tracked',
      details: {
        metric_name,
        value,
        metadata,
        timestamp: new Date().toISOString()
      }
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});