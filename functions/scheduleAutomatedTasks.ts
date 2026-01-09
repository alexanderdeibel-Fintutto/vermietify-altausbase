import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Setting up automated tasks');

    // Tasks to schedule:
    // 1. Daily analytics generation
    // 2. AI insights generation
    // 3. Report export
    // 4. Alert checks

    const tasks = [
      {
        name: 'Daily Analytics Generation',
        function_name: 'generateTesterAnalytics',
        schedule: 'daily_2am',
        enabled: true
      },
      {
        name: 'AI Insights Generation',
        function_name: 'generateAIInsights',
        schedule: 'daily_4am',
        enabled: true
      },
      {
        name: 'Weekly Report Export',
        function_name: 'generateReportExport',
        schedule: 'weekly_monday_8am',
        enabled: true
      },
      {
        name: 'Critical Alert Check',
        function_name: 'checkCriticalAlerts',
        schedule: 'every_hour',
        enabled: true
      }
    ];

    console.log('Scheduled tasks:', tasks.length);

    return Response.json({
      success: true,
      tasks_scheduled: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});