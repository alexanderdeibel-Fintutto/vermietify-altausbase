import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { period = 'week' } = await req.json();
    
    // Alle Test-Sessions laden
    const allSessions = await base44.asServiceRole.entities.TestSession.list('-session_start');
    
    // Filter nach Periode
    let cutoffDate = new Date();
    switch(period) {
      case 'today':
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      default:
        cutoffDate = new Date(0); // Alle
    }
    
    const filteredSessions = allSessions.filter(s => 
      new Date(s.session_start) >= cutoffDate
    );
    
    // Statistiken berechnen
    const stats = {
      totalSessions: filteredSessions.length,
      activeSessions: filteredSessions.filter(s => !s.session_end).length,
      totalTime: filteredSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0),
      averageRating: filteredSessions.filter(s => s.feedback_rating).length > 0
        ? (filteredSessions.reduce((sum, s) => sum + (s.feedback_rating || 0), 0) / filteredSessions.filter(s => s.feedback_rating).length).toFixed(1)
        : 0,
      uniqueFeatures: new Set(filteredSessions.flatMap(s => s.features_tested || [])).size,
      totalPages: filteredSessions.reduce((sum, s) => sum + (s.pages_visited?.length || 0), 0),
      totalActions: filteredSessions.reduce((sum, s) => sum + (s.actions_performed?.length || 0), 0)
    };
    
    // Testzeit pro Tag
    const dailyData = {};
    filteredSessions.forEach(session => {
      const date = session.session_start.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { sessions: 0, duration: 0 };
      }
      dailyData[date].sessions++;
      dailyData[date].duration += session.total_duration || 0;
    });
    
    // Feature-Häufigkeit
    const featureCount = {};
    filteredSessions.forEach(session => {
      (session.features_tested || []).forEach(feature => {
        featureCount[feature] = (featureCount[feature] || 0) + 1;
      });
    });
    
    const topFeatures = Object.entries(featureCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));
    
    return Response.json({ 
      success: true,
      stats,
      dailyData,
      topFeatures,
      sessions: filteredSessions
    });
    
  } catch (error) {
    console.error("Get testing statistics error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});