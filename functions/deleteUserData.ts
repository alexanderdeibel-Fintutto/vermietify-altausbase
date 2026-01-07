import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const requestingUser = await base44.auth.me();
    
    if (!requestingUser || requestingUser.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { userId, confirmEmail } = await req.json();
    
    if (!userId || !confirmEmail) {
      return Response.json({ error: "userId and confirmEmail required" }, { status: 400 });
    }
    
    // User laden und Email verifizieren
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    const user = users[0];
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    if (user.email !== confirmEmail) {
      return Response.json({ error: "Email confirmation failed" }, { status: 400 });
    }
    
    const deletionLog = {
      deletedAt: new Date().toISOString(),
      deletedBy: requestingUser.email,
      userId: user.id,
      userEmail: user.email,
      itemsDeleted: {
        roleAssignments: 0,
        moduleAccess: 0,
        activities: 0,
        testSessions: 0
      }
    };
    
    // Rollen-Zuweisungen löschen
    const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_id: userId
    });
    for (const ra of roleAssignments) {
      await base44.asServiceRole.entities.UserRoleAssignment.delete(ra.id);
      deletionLog.itemsDeleted.roleAssignments++;
    }
    
    // Modul-Zugriffe löschen
    const moduleAccess = await base44.asServiceRole.entities.ModuleAccess.filter({
      account_id: userId
    });
    for (const ma of moduleAccess) {
      await base44.asServiceRole.entities.ModuleAccess.delete(ma.id);
      deletionLog.itemsDeleted.moduleAccess++;
    }
    
    // Aktivitäten anonymisieren (nicht komplett löschen für Audit-Trail)
    const activities = await base44.asServiceRole.entities.UserActivity.filter({
      user_id: userId
    });
    for (const activity of activities) {
      await base44.asServiceRole.entities.UserActivity.update(activity.id, {
        user_id: 'DELETED_USER',
        details: { ...activity.details, anonymized: true }
      });
      deletionLog.itemsDeleted.activities++;
    }
    
    // Test-Sessions löschen
    if (user.is_tester) {
      const testSessions = await base44.asServiceRole.entities.TestSession.filter({
        user_id: userId
      });
      for (const ts of testSessions) {
        await base44.asServiceRole.entities.TestSession.delete(ts.id);
        deletionLog.itemsDeleted.testSessions++;
      }
    }
    
    // User-Record anonymisieren (nicht löschen wegen Foreign Keys)
    await base44.asServiceRole.entities.User.update(userId, {
      email: `deleted_${userId}@anonymized.local`,
      full_name: 'DELETED USER',
      is_tester: false,
      last_activity: null
    });
    
    return Response.json({
      success: true,
      message: 'User data successfully deleted',
      deletionLog
    });
    
  } catch (error) {
    console.error("Delete user data error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});