import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metrics } = await req.json();
    
    // Log performance metrics
    const performanceData = {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      navigation_calc_time: metrics.navigationCalcTime,
      feature_check_time: metrics.featureCheckTime,
      total_render_time: metrics.totalRenderTime,
      cache_hit: metrics.cacheHit,
      user_agent: req.headers.get('user-agent')
    };

    // Check if performance is within acceptable range (<100ms)
    const isWithinTarget = metrics.navigationCalcTime < 100;
    
    if (!isWithinTarget) {
      console.warn(`Navigation performance degraded: ${metrics.navigationCalcTime}ms (target: <100ms)`);
      
      // Log to system for monitoring
      await base44.asServiceRole.entities.ActivityLog.create({
        user_id: user.id,
        action: 'NAVIGATION_PERFORMANCE_DEGRADED',
        details: performanceData,
        severity: 'warning'
      });
    }

    return Response.json({ 
      success: true, 
      withinTarget: isWithinTarget,
      recommendation: isWithinTarget ? null : 'Consider clearing cache or checking system load'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});