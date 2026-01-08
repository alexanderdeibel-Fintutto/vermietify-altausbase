import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { frequency, recipients, report_type } = await req.json();

    // Automatischen Report-Schedule erstellen
    const schedule = await base44.asServiceRole.entities.ReportSchedule.create({
      name: `Automatic ${report_type} Report`,
      report_type: 'user_activity',
      frequency: frequency, // 'daily', 'weekly', 'monthly'
      recipients: recipients,
      format: 'pdf',
      config: {
        summary_type: report_type,
        include_executive_summary: true,
        include_charts: true,
        auto_send: true
      },
      is_active: true,
      created_by: user.id
    });

    // Nächste Ausführungszeit berechnen
    const now = new Date();
    let nextRun = new Date(now);
    
    switch(frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(8, 0, 0, 0); // 8:00 Uhr
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (8 - nextRun.getDay())); // Nächster Montag
        nextRun.setHours(8, 0, 0, 0);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setHours(8, 0, 0, 0);
        break;
    }

    await base44.asServiceRole.entities.ReportSchedule.update(schedule.id, {
      next_run: nextRun.toISOString()
    });

    return Response.json({
      success: true,
      schedule_id: schedule.id,
      next_run: nextRun.toISOString(),
      message: `Automatic ${frequency} reports scheduled for ${recipients.length} recipients`
    });

  } catch (error) {
    console.error('Error scheduling reports:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});