import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { timeRange = '30d' } = await req.json();
    
    // Zeitbereich berechnen
    const now = new Date();
    const ranges = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const daysAgo = ranges[timeRange] || 30;
    const startDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    
    // Test-Sessions laden
    const allSessions = await base44.asServiceRole.entities.TestSession.list('-session_start');
    const sessions = allSessions.filter(s => new Date(s.session_start) >= startDate);
    
    // Tester laden
    const users = await base44.asServiceRole.entities.User.list();
    const testers = users.filter(u => u.is_tester);
    
    // Statistiken berechnen
    const stats = {
      activeTesters: testers.length,
      totalSessions: sessions.length,
      sessionsToday: sessions.filter(s => {
        const sessionDate = new Date(s.session_start);
        return sessionDate.toDateString() === now.toDateString();
      }).length,
      totalTestTime: sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0),
      averageRating: sessions.filter(s => s.feedback_rating).length > 0
        ? sessions.reduce((sum, s) => sum + (s.feedback_rating || 0), 0) / sessions.filter(s => s.feedback_rating).length
        : 0,
      uniqueFeatures: new Set(sessions.flatMap(s => s.features_tested || [])).size
    };
    
    // Testzeit pro Tag
    const testTimeByDay = {};
    sessions.forEach(session => {
      const date = new Date(session.session_start).toISOString().split('T')[0];
      testTimeByDay[date] = (testTimeByDay[date] || 0) + (session.total_duration || 0);
    });
    
    // Features nach Häufigkeit
    const featureCounts = {};
    sessions.forEach(session => {
      (session.features_tested || []).forEach(feature => {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      });
    });
    
    return Response.json({
      success: true,
      stats,
      timeRange,
      testTimeByDay: Object.entries(testTimeByDay).map(([date, minutes]) => ({
        date,
        hours: Math.round(minutes / 60 * 10) / 10
      })),
      featureTests: Object.entries(featureCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([feature, count]) => ({ feature, tests: count }))
    });
    
  } catch (error) {
    console.error("Get testing statistics error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});