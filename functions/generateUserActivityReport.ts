import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { userId, startDate, endDate } = await req.json();
    
    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }
    
    const targetUser = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (!targetUser || targetUser.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    let activities = await base44.asServiceRole.entities.UserActivity.filter({ 
      user_id: userId 
    });
    
    // Filter by date range if provided
    if (startDate) {
      activities = activities.filter(a => new Date(a.created_date) >= new Date(startDate));
    }
    if (endDate) {
      activities = activities.filter(a => new Date(a.created_date) <= new Date(endDate));
    }
    
    const report = {
      user: targetUser[0],
      period: {
        start: startDate || activities[activities.length - 1]?.created_date,
        end: endDate || activities[0]?.created_date
      },
      summary: {
        totalActivities: activities.length,
        byActionType: activities.reduce((acc, a) => {
          acc[a.action_type] = (acc[a.action_type] || 0) + 1;
          return acc;
        }, {}),
        byResource: activities.reduce((acc, a) => {
          acc[a.resource] = (acc[a.resource] || 0) + 1;
          return acc;
        }, {}),
        uniqueDays: [...new Set(activities.map(a => 
          new Date(a.created_date).toISOString().split('T')[0]
        ))].length,
        avgActivitiesPerDay: activities.length / Math.max(1, 
          [...new Set(activities.map(a => 
            new Date(a.created_date).toISOString().split('T')[0]
          ))].length
        )
      },
      activities: activities.slice(0, 100) // Last 100 activities
    };
    
    return Response.json({
      success: true,
      report
    });
    
  } catch (error) {
    console.error("Generate user activity report error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});