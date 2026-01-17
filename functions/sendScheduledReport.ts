import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const schedules = await base44.asServiceRole.entities.ReportSchedule.filter({
      is_active: true
    });

    const today = new Date().getDay();
    const dayOfMonth = new Date().getDate();

    let reportsSent = 0;

    for (const schedule of schedules) {
      let shouldSend = false;

      if (schedule.frequency === 'daily') {
        shouldSend = true;
      } else if (schedule.frequency === 'weekly' && today === 1) {
        shouldSend = true;
      } else if (schedule.frequency === 'monthly' && dayOfMonth === 1) {
        shouldSend = true;
      }

      if (shouldSend) {
        const reportData = await base44.asServiceRole.functions.invoke('generateUsageReport', {});
        
        const recipients = typeof schedule.recipients === 'string' 
          ? JSON.parse(schedule.recipients) 
          : schedule.recipients;

        for (const email of recipients) {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `${schedule.report_type} Bericht - ${new Date().toLocaleDateString('de-DE')}`,
            body: `Ihr automatischer Bericht ist bereit.\n\n${JSON.stringify(reportData.data, null, 2)}`,
            from_name: 'vermitify Reports'
          });
        }

        reportsSent++;
      }
    }

    return Response.json({ success: true, reports_sent: reportsSent });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});