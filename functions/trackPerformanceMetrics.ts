import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metric_type, value, metadata } = await req.json();

    console.log(`[METRICS] Tracking: ${metric_type} = ${value}`);

    const metric = {
      metric_type,
      value,
      metadata: metadata || {},
      recorded_at: new Date().toISOString(),
      recorded_by: user.email
    };

    // In production würde hier ein Metrics-Service verwendet
    return Response.json({ success: true, metric });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});