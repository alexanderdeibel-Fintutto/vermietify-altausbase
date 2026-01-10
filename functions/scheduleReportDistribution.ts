import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      company_id,
      name,
      report_type,
      frequency,
      schedule_day,
      schedule_time,
      recipients,
      include_charts,
      include_summary,
      include_predictions
    } = await req.json();

    // Create report schedule
    const schedule = await base44.asServiceRole.entities.ReportSchedule.create({
      company_id,
      name,
      report_type,
      frequency,
      schedule_day,
      schedule_time,
      recipients,
      include_charts,
      include_summary,
      include_predictions,
      created_by: user.email
    });

    // Log creation
    await base44.functions.invoke('logAuditAction', {
      action_type: 'workflow_created',
      entity_type: 'workflow',
      entity_id: company_id,
      user_email: user.email,
      company_id,
      description: `Berichtszeitplan "${name}" erstellt (${frequency})`,
      metadata: { schedule_id: schedule.id }
    });

    return Response.json({
      success: true,
      schedule
    });
  } catch (error) {
    console.error('Schedule report distribution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});