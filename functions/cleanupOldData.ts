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
    
    let deletedCounts = {
      userActivity: 0,
      testSessions: 0,
      expiredApiKeys: 0
    };
    
    // UserActivity älter als 2 Jahre
    const oldActivities = await base44.asServiceRole.entities.UserActivity.filter({});
    const toDeleteActivities = oldActivities.filter(a => 
      new Date(a.created_date) < twoYearsAgo
    );
    
    if (!dryRun) {
      for (const activity of toDeleteActivities) {
        await base44.asServiceRole.entities.UserActivity.delete(activity.id);
      }
    }
    deletedCounts.userActivity = toDeleteActivities.length;
    
    // TestSessions älter als 1 Jahr
    const oldSessions = await base44.asServiceRole.entities.TestSession.filter({});
    const toDeleteSessions = oldSessions.filter(s => 
      new Date(s.created_date) < oneYearAgo
    );
    
    if (!dryRun) {
      for (const session of toDeleteSessions) {
        await base44.asServiceRole.entities.TestSession.delete(session.id);
      }
    }
    deletedCounts.testSessions = toDeleteSessions.length;
    
    // Abgelaufene API Keys
    const apiKeys = await base44.asServiceRole.entities.APIKey.filter({});
    const expiredKeys = apiKeys.filter(k => 
      k.expires_at && new Date(k.expires_at) < now
    );
    
    if (!dryRun) {
      for (const key of expiredKeys) {
        await base44.asServiceRole.entities.APIKey.update(key.id, { is_active: false });
      }
    }
    deletedCounts.expiredApiKeys = expiredKeys.length;
    
    return Response.json({
      success: true,
      dryRun,
      deletedCounts,
      message: dryRun 
        ? "Dry run - keine Daten gelöscht" 
        : "Alte Daten erfolgreich bereinigt"
    });
    
  } catch (error) {
    console.error("Cleanup error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});