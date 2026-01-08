import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function runs as a scheduled task to generate all active reports
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active schedules
    const schedules = await base44.asServiceRole.entities.ReportSchedule.filter({ 
      is_active: true 
    });

    const now = new Date();
    const results = [];

    for (const schedule of schedules) {
      // Check if report should run based on frequency
      let shouldRun = false;
      
      if (schedule.last_run) {
        const lastRun = new Date(schedule.last_run);
        const hoursSinceLastRun = (now - lastRun) / (1000 * 60 * 60);
        
        switch (schedule.frequency) {
          case 'daily':
            shouldRun = hoursSinceLastRun >= 24;
            break;
          case 'weekly':
            shouldRun = hoursSinceLastRun >= 168; // 7 days
            break;
          case 'monthly':
            shouldRun = hoursSinceLastRun >= 720; // 30 days
            break;
          case 'quarterly':
            shouldRun = hoursSinceLastRun >= 2160; // 90 days
            break;
        }
      } else {
        // Never run before, run now
        shouldRun = true;
      }

      if (shouldRun) {
        try {
          const response = await base44.asServiceRole.functions.invoke('generateScheduledReport', {
            scheduleId: schedule.id
          });
          results.push({
            scheduleId: schedule.id,
            name: schedule.name,
            success: true,
            data: response.data
          });
        } catch (error) {
          results.push({
            scheduleId: schedule.id,
            name: schedule.name,
            success: false,
            error: error.message
          });
        }
      }
    }

    return Response.json({
      success: true,
      timestamp: now.toISOString(),
      schedulesChecked: schedules.length,
      reportsGenerated: results.filter(r => r.success).length,
      results
    });
  } catch (error) {
    console.error('Error in scheduled report task:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});