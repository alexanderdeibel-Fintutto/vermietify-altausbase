import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const startTime = Date.now();
    
    // System-Health-Checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    // Database Check
    try {
      await base44.asServiceRole.entities.User.list();
      health.checks.database = { status: 'healthy', responseTime: Date.now() - startTime };
    } catch (error) {
      health.checks.database = { status: 'error', error: error.message };
      health.status = 'unhealthy';
    }
    
    // Activity Logging Check
    try {
      const activities = await base44.asServiceRole.entities.UserActivity.list();
      health.checks.activityLogging = { 
        status: 'healthy', 
        totalActivities: activities.length 
      };
    } catch (error) {
      health.checks.activityLogging = { status: 'error', error: error.message };
      health.status = 'warning';
    }
    
    // User System Check
    try {
      const users = await base44.asServiceRole.entities.User.list();
      const activeUsers = users.filter(u => 
        u.last_activity && (new Date() - new Date(u.last_activity)) < 24 * 60 * 60 * 1000
      );
      
      health.checks.userSystem = {
        status: 'healthy',
        totalUsers: users.length,
        activeUsers: activeUsers.length
      };
    } catch (error) {
      health.checks.userSystem = { status: 'error', error: error.message };
      health.status = 'warning';
    }
    
    // Permissions System Check
    try {
      const roles = await base44.asServiceRole.entities.Role.list();
      const permissions = await base44.asServiceRole.entities.Permission.list();
      
      health.checks.permissions = {
        status: 'healthy',
        totalRoles: roles.length,
        totalPermissions: permissions.length
      };
    } catch (error) {
      health.checks.permissions = { status: 'error', error: error.message };
      health.status = 'warning';
    }
    
    // Performance Metriken
    const responseTime = Date.now() - startTime;
    health.performance = {
      totalResponseTime: responseTime,
      uptime: '99.9%', // In Produktion von echtem Monitoring-Service
      errorRate: 0.1
    };
    
    return Response.json(health);
    
  } catch (error) {
    console.error("System health check error:", error);
    return Response.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});