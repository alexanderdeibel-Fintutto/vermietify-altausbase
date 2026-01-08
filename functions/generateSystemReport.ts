import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { reportType = 'full' } = await req.json();
    
    // Fetch all data
    const [users, roles, permissions, roleAssignments, moduleAccess, apiKeys, testSessions, userActivity] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Role.list(),
      base44.asServiceRole.entities.Permission.list(),
      base44.asServiceRole.entities.UserRoleAssignment.list(),
      base44.asServiceRole.entities.ModuleAccess.list(),
      base44.asServiceRole.entities.APIKey.list(),
      base44.asServiceRole.entities.TestSession.list(),
      base44.asServiceRole.entities.UserActivity.list()
    ]);
    
    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: user.email,
      reportType,
      
      summary: {
        users: {
          total: users.length,
          admins: users.filter(u => u.role === 'admin').length,
          testers: users.filter(u => u.is_tester).length,
          active: users.filter(u => u.role !== 'inactive').length
        },
        roles: {
          total: roles.length,
          active: roles.filter(r => r.is_active).length,
          predefined: roles.filter(r => r.is_predefined).length,
          custom: roles.filter(r => !r.is_predefined).length
        },
        permissions: {
          total: permissions.length,
          active: permissions.filter(p => p.is_active).length,
          byModule: permissions.reduce((acc, p) => {
            acc[p.module] = (acc[p.module] || 0) + 1;
            return acc;
          }, {})
        },
        assignments: {
          total: roleAssignments.length,
          active: roleAssignments.filter(ra => ra.is_active).length,
          withBuildingRestrictions: roleAssignments.filter(ra => ra.building_restrictions).length
        },
        modules: {
          total: moduleAccess.length,
          active: moduleAccess.filter(ma => ma.is_active).length,
          revenue: moduleAccess.reduce((sum, ma) => sum + (ma.price_paid || 0), 0)
        },
        apiKeys: {
          total: apiKeys.length,
          active: apiKeys.filter(k => k.is_active).length,
          totalUsage: apiKeys.reduce((sum, k) => sum + (k.usage_count || 0), 0)
        },
        testing: {
          totalSessions: testSessions.length,
          totalDuration: testSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0),
          avgRating: testSessions.filter(s => s.feedback_rating).reduce((sum, s) => sum + s.feedback_rating, 0) / testSessions.filter(s => s.feedback_rating).length || 0
        },
        activity: {
          totalActivities: userActivity.length,
          last24h: userActivity.filter(a => new Date(a.created_date) > new Date(Date.now() - 24*60*60*1000)).length,
          last7days: userActivity.filter(a => new Date(a.created_date) > new Date(Date.now() - 7*24*60*60*1000)).length
        }
      }
    };
    
    if (reportType === 'full') {
      report.details = {
        topActiveUsers: userActivity.reduce((acc, a) => {
          acc[a.user_id] = (acc[a.user_id] || 0) + 1;
          return acc;
        }, {}),
        roleDistribution: roleAssignments.reduce((acc, ra) => {
          acc[ra.role_id] = (acc[ra.role_id] || 0) + 1;
          return acc;
        }, {}),
        moduleUsage: moduleAccess.reduce((acc, ma) => {
          acc[ma.module_code] = (acc[ma.module_code] || 0) + 1;
          return acc;
        }, {})
      };
    }
    
    return Response.json({
      success: true,
      report
    });
    
  } catch (error) {
    console.error("Generate system report error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});