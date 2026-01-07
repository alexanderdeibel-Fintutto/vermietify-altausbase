import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const requestingUser = await base44.auth.me();
    
    if (!requestingUser || requestingUser.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { userId } = await req.json();
    
    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }
    
    // Alle Benutzerdaten sammeln
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    const user = users[0];
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    // Rollen-Zuweisungen
    const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_id: userId
    });
    
    // Modul-Zugriffe
    const moduleAccess = await base44.asServiceRole.entities.ModuleAccess.filter({
      account_id: userId
    });
    
    // Aktivitäten
    const activities = await base44.asServiceRole.entities.UserActivity.filter({
      user_id: userId
    });
    
    // Test-Sessions (wenn Tester)
    let testSessions = [];
    if (user.is_tester) {
      testSessions = await base44.asServiceRole.entities.TestSession.filter({
        user_id: userId
      });
    }
    
    // Vollständiger Datenexport
    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: requestingUser.email,
      userData: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_tester: user.is_tester,
        created_date: user.created_date,
        last_activity: user.last_activity
      },
      roleAssignments: roleAssignments.map(ra => ({
        role_id: ra.role_id,
        valid_from: ra.valid_from,
        valid_until: ra.valid_until,
        building_restrictions: ra.building_restrictions,
        created_date: ra.created_date
      })),
      moduleAccess: moduleAccess.map(ma => ({
        module_code: ma.module_code,
        is_active: ma.is_active,
        purchased_date: ma.purchased_date,
        expires_date: ma.expires_date
      })),
      activities: {
        total: activities.length,
        byType: {},
        recent: activities.slice(0, 100).map(a => ({
          action_type: a.action_type,
          resource: a.resource,
          created_date: a.created_date
        }))
      },
      testSessions: testSessions.map(ts => ({
        session_start: ts.session_start,
        session_end: ts.session_end,
        total_duration: ts.total_duration,
        features_tested: ts.features_tested,
        feedback_rating: ts.feedback_rating
      }))
    };
    
    // Aktivitäten nach Typ gruppieren
    activities.forEach(a => {
      exportData.activities.byType[a.action_type] = 
        (exportData.activities.byType[a.action_type] || 0) + 1;
    });
    
    return Response.json(exportData);
    
  } catch (error) {
    console.error("Export user data error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});