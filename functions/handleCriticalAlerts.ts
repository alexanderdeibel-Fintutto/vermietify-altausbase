import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { alert_type, alert_message, severity, building_id, unit_id, reference_id } = await req.json();

    if (!alert_type || !alert_message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isPriority = severity === 'critical' || severity === 'high';

    // Create notification for all admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, null, 100);

    const notificationPromises = admins.map(admin =>
      base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        title: `Alert: ${alert_type}`,
        message: alert_message,
        type: alert_type,
        priority: isPriority ? 'high' : 'medium',
        is_read: false,
        metadata: { severity, building_id, unit_id, reference_id }
      })
    );

    await Promise.all(notificationPromises);

    // Create task if critical
    if (isPriority && building_id) {
      const taskTitle = `[ALERT] ${alert_type}`;
      await base44.asServiceRole.entities.BuildingTask.create({
        building_id,
        unit_id: unit_id || null,
        task_title: taskTitle,
        description: alert_message,
        task_type: 'administrative',
        priority: 'urgent',
        status: 'open',
        due_date: new Date().toISOString(),
        source_type: 'alert',
        source_id: reference_id || alert_type,
        ai_generated: true,
        ai_priority_score: 100
      });
    }

    // Send Slack notification if critical
    if (isPriority) {
      try {
        await base44.integrations.Slack.SendMessage({
          channel: '#alerts',
          text: `🚨 *${alert_type}* (${severity})\n${alert_message}`
        });
      } catch (slackError) {
        console.log('Slack notification failed (non-critical):', slackError.message);
      }
    }

    return Response.json({ 
      message: 'Alert processed',
      notificationsCreated: admins.length,
      taskCreated: isPriority && building_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});