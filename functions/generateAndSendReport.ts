import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { schedule_id, company_id } = await req.json();

    // Get schedule
    const schedule = await base44.asServiceRole.entities.ReportSchedule.read(schedule_id);

    if (!schedule) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Generate analytics
    const analyticsRes = await base44.functions.invoke('generateWorkflowAnalytics', {
      company_id,
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    });

    const analytics = analyticsRes.data || {};

    // Get predictions if requested
    let predictions = null;
    if (schedule.include_predictions) {
      const predRes = await base44.functions.invoke('predictWorkflowCompletion', {
        company_id
      });
      predictions = predRes.data || {};
    }

    // Build email content
    let emailBody = `<h2>${schedule.name}</h2>`;
    emailBody += `<p>Bericht generiert: ${new Date().toLocaleDateString('de-DE')}</p>`;

    if (schedule.include_summary && analytics.metrics) {
      emailBody += `<h3>Zusammenfassung</h3>`;
      emailBody += `<ul>`;
      emailBody += `<li>Gesamtausführungen: ${analytics.metrics.total_executions}</li>`;
      emailBody += `<li>Abschlussrate: ${analytics.metrics.completion_rate}%</li>`;
      emailBody += `<li>Fehlerrate: ${analytics.metrics.failure_rate}%</li>`;
      emailBody += `<li>Ø Ausführungszeit: ${analytics.metrics.avg_execution_time} Min</li>`;
      emailBody += `</ul>`;
    }

    if (schedule.include_predictions && predictions.active_predictions?.length > 0) {
      emailBody += `<h3>Prognosen</h3>`;
      emailBody += `<ul>`;
      predictions.active_predictions.slice(0, 5).forEach(pred => {
        emailBody += `<li>Workflow ${pred.workflow_id}: Ø ${pred.estimated_remaining_minutes} Min verbleibend (Risiko: ${pred.delay_risk})</li>`;
      });
      emailBody += `</ul>`;
    }

    emailBody += `<p><small>Dieser Bericht wurde automatisch generiert.</small></p>`;

    // Send to each recipient
    const sendPromises = schedule.recipients.map(recipient =>
      base44.integrations.Core.SendEmail({
        to: recipient,
        subject: `Workflow-Bericht: ${schedule.name}`,
        body: emailBody,
        from_name: 'Workflow Analytics'
      })
    );

    await Promise.all(sendPromises);

    // Update last sent time
    await base44.asServiceRole.entities.ReportSchedule.update(schedule_id, {
      last_sent: new Date().toISOString()
    });

    return Response.json({
      success: true,
      recipients_count: schedule.recipients.length
    });
  } catch (error) {
    console.error('Generate and send report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});