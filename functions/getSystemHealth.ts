import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);
    
    // Metriken sammeln
    const [users, roles, permissions, moduleAccess, testSessions, apiKeys, userActivity] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Role.list(),
      base44.asServiceRole.entities.Permission.list(),
      base44.asServiceRole.entities.ModuleAccess.list(),
      base44.asServiceRole.entities.TestSession.list(),
      base44.asServiceRole.entities.APIKey.list(),
      base44.asServiceRole.entities.UserActivity.list()
    ]);
    
    const testSessions24h = testSessions.filter(s => 
      new Date(s.session_start) >= yesterday
    );
    
    const userActivity24h = userActivity.filter(a => 
      new Date(a.created_date) >= yesterday
    );
    
    // Service-Status prüfen
    const services = [
      {
        name: 'User Management',
        status: users.length > 0 ? 'healthy' : 'warning',
        message: `${users.length} users`
      },
      {
        name: 'Permission System',
        status: roles.length > 0 && permissions.length > 0 ? 'healthy' : 'warning',
        message: `${roles.length} roles, ${permissions.length} permissions`
      },
      {
        name: 'Module Access',
        status: 'healthy',
        message: `${moduleAccess.filter(ma => ma.is_active).length} active modules`
      },
      {
        name: 'Testing System',
        status: testSessions24h.length > 0 ? 'healthy' : 'warning',
        message: `${testSessions24h.length} sessions in 24h`
      }
    ];
    
    const hasError = services.some(s => s.status === 'error');
    const hasWarning = services.some(s => s.status === 'warning');
    const overallStatus = hasError ? 'error' : hasWarning ? 'warning' : 'healthy';
    
    return Response.json({
      success: true,
      overallStatus,
      timestamp: now.toISOString(),
      services,
      metrics: {
        totalUsers: users.length,
        totalEntities: users.length + roles.length + permissions.length,
        totalApiKeys: apiKeys.length,
        activeRoles: roles.filter(r => r.is_active).length,
        totalPermissions: permissions.length,
        activeModules: moduleAccess.filter(ma => ma.is_active).length,
        testSessions24h: testSessions24h.length,
        userActivity24h: userActivity24h.length
      }
    });
    
  } catch (error) {
    console.error("Get system health error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});