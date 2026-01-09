import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();
    const { operationType, duration, success, metadata } = data;

    // Store performance metric
    await base44.entities.UserActivity.create({
      user_id: user.id,
      activity_type: 'navigation_performance',
      details: {
        operation: operationType,
        duration_ms: duration,
        success: success || true,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      }
    });

    // If duration is too high, log for investigation
    if (duration > 1000) {
      console.warn(`Slow navigation operation for user ${user.id}: ${operationType} took ${duration}ms`);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});