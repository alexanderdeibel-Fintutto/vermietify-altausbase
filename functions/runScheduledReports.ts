import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Alle aktiven Schedules holen die fällig sind
    const now = new Date();
    const schedules = await base44.asServiceRole.entities.ReportSchedule.filter({
      is_active: true
    });

    const dueSchedules = schedules.filter(s => 
      s.next_run && new Date(s.next_run) <= now
    );

    const results = [];

    for (const schedule of dueSchedules) {
      try {
        // Zeitraum berechnen
        let dateFrom = new Date();
        let dateTo = new Date();
        
        switch(schedule.frequency) {
          case 'daily':
            dateFrom.setDate(dateFrom.getDate() - 1);
            break;
          case 'weekly':
            dateFrom.setDate(dateFrom.getDate() - 7);
            break;
          case 'monthly':
            dateFrom.setMonth(dateFrom.getMonth() - 1);
            break;
        }

        // Report generieren
        const summaryResponse = await base44.functions.invoke('generateIntelligentReportSummary', {
          date_from: dateFrom.toISOString(),
          date_to: dateTo.toISOString(),
          summary_type: schedule.report_type
        });

        if (summaryResponse.data.summary) {
          const summary = summaryResponse.data.summary;

          // PDF exportieren
          const pdfResponse = await base44.functions.invoke('exportReportToPDF', {
            summary_id: summary.id
          });

          // Email an alle Recipients senden
          for (const recipient of schedule.recipients) {
            await base44.integrations.Core.SendEmail({
              to: recipient,
              subject: `${schedule.name} - ${new Date().toLocaleDateString('de-DE')}`,
              body: `
                <h2>${schedule.name}</h2>
                <p>Anbei der automatisch generierte Report für den Zeitraum:</p>
                <p><strong>${dateFrom.toLocaleDateString('de-DE')} - ${dateTo.toLocaleDateString('de-DE')}</strong></p>
                
                <h3>Zusammenfassung:</h3>
                <ul>
                  <li>Gesamt Reports: ${summary.total_reports}</li>
                  <li>Kritische Issues: ${summary.reports_by_priority?.p1 || 0}</li>
                  <li>Hohe Priorität: ${summary.reports_by_priority?.p2 || 0}</li>
                </ul>
                
                <p>Den vollständigen Report finden Sie im Anhang.</p>
                <p>Beste Grüße,<br>Ihr Testing System</p>
              `
            });
          }

          results.push({
            schedule_id: schedule.id,
            status: 'success',
            recipients: schedule.recipients.length
          });

          // Nächste Ausführungszeit berechnen
          const nextRun = new Date(schedule.next_run);
          switch(schedule.frequency) {
            case 'daily':
              nextRun.setDate(nextRun.getDate() + 1);
              break;
            case 'weekly':
              nextRun.setDate(nextRun.getDate() + 7);
              break;
            case 'monthly':
              nextRun.setMonth(nextRun.getMonth() + 1);
              break;
          }

          await base44.asServiceRole.entities.ReportSchedule.update(schedule.id, {
            next_run: nextRun.toISOString(),
            last_run: now.toISOString()
          });
        }

      } catch (error) {
        results.push({
          schedule_id: schedule.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      executed: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error running scheduled reports:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});