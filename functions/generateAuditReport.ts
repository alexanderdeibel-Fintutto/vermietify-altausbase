import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { startDate, endDate, userId = null } = await req.json();
    
    // Alle relevanten Daten sammeln
    const activities = await base44.asServiceRole.entities.UserActivity.list('-created_date');
    const testSessions = await base44.asServiceRole.entities.TestSession.list('-session_start');
    const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.list('-created_date');
    
    // Filtern nach Datum und User
    let filteredActivities = activities;
    let filteredSessions = testSessions;
    let filteredAssignments = roleAssignments;
    
    if (startDate) {
      const start = new Date(startDate);
      filteredActivities = filteredActivities.filter(a => new Date(a.created_date) >= start);
      filteredSessions = filteredSessions.filter(s => new Date(s.session_start) >= start);
      filteredAssignments = filteredAssignments.filter(ra => new Date(ra.created_date) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filteredActivities = filteredActivities.filter(a => new Date(a.created_date) <= end);
      filteredSessions = filteredSessions.filter(s => new Date(s.session_start) <= end);
      filteredAssignments = filteredAssignments.filter(ra => new Date(ra.created_date) <= end);
    }
    
    if (userId) {
      filteredActivities = filteredActivities.filter(a => a.user_id === userId);
      filteredSessions = filteredSessions.filter(s => s.user_id === userId);
      filteredAssignments = filteredAssignments.filter(ra => ra.user_id === userId);
    }
    
    // Statistiken berechnen
    const stats = {
      totalActivities: filteredActivities.length,
      totalSessions: filteredSessions.length,
      totalRoleChanges: filteredAssignments.length,
      uniqueUsers: new Set([
        ...filteredActivities.map(a => a.user_id),
        ...filteredSessions.map(s => s.user_id)
      ]).size,
      activityByType: {},
      activityByResource: {},
      sessionsByUser: {},
      averageSessionDuration: 0
    };
    
    // Activity by type
    filteredActivities.forEach(a => {
      stats.activityByType[a.action_type] = (stats.activityByType[a.action_type] || 0) + 1;
      stats.activityByResource[a.resource] = (stats.activityByResource[a.resource] || 0) + 1;
    });
    
    // Sessions by user
    filteredSessions.forEach(s => {
      stats.sessionsByUser[s.user_id] = (stats.sessionsByUser[s.user_id] || 0) + 1;
    });
    
    // Average session duration
    const totalDuration = filteredSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0);
    stats.averageSessionDuration = filteredSessions.length > 0 
      ? Math.round(totalDuration / filteredSessions.length) 
      : 0;
    
    // Top 10 most active users
    const userActivityCount = {};
    filteredActivities.forEach(a => {
      userActivityCount[a.user_id] = (userActivityCount[a.user_id] || 0) + 1;
    });
    
    const topUsers = Object.entries(userActivityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));
    
    return Response.json({
      success: true,
      period: { startDate, endDate },
      stats,
      topUsers,
      activities: filteredActivities.slice(0, 100), // Limit für Performance
      sessions: filteredSessions.slice(0, 50),
      roleAssignments: filteredAssignments
    });
    
  } catch (error) {
    console.error("Generate audit report error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});