import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { dryRun = true } = await req.json();
    
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    const deletionStats = {
      activitiesDeleted: 0,
      testSessionsArchived: 0,
      expiredRoleAssignments: 0
    };
    
    // Alte Aktivitäts-Logs (älter als 2 Jahre)
    const oldActivities = await base44.asServiceRole.entities.UserActivity.list();
    for (const activity of oldActivities) {
      if (new Date(activity.created_date) < twoYearsAgo) {
        if (!dryRun) {
          await base44.asServiceRole.entities.UserActivity.delete(activity.id);
        }
        deletionStats.activitiesDeleted++;
      }
    }
    
    // Alte Test-Sessions (älter als 1 Jahr)
    const oldSessions = await base44.asServiceRole.entities.TestSession.list();
    for (const session of oldSessions) {
      if (new Date(session.session_start) < oneYearAgo) {
        if (!dryRun) {
          // In der Produktion würde man diese archivieren statt löschen
          await base44.asServiceRole.entities.TestSession.delete(session.id);
        }
        deletionStats.testSessionsArchived++;
      }
    }
    
    // Abgelaufene Rollen-Zuweisungen deaktivieren
    const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.list();
    for (const assignment of roleAssignments) {
      if (assignment.valid_until && new Date(assignment.valid_until) < now && assignment.is_active) {
        if (!dryRun) {
          await base44.asServiceRole.entities.UserRoleAssignment.update(assignment.id, {
            is_active: false
          });
        }
        deletionStats.expiredRoleAssignments++;
      }
    }
    
    return Response.json({
      success: true,
      dryRun,
      deletionStats,
      message: dryRun 
        ? 'Dry-Run abgeschlossen - keine Daten gelöscht' 
        : 'Alte Daten erfolgreich bereinigt'
    });
    
  } catch (error) {
    console.error("Cleanup error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});