import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { sensor_id, value, threshold_type, threshold_value } = await req.json();

  const sensor = await base44.asServiceRole.entities.IoTSensor.filter({ 
    id: sensor_id 
  }).then(s => s[0]);

  if (!sensor) {
    return Response.json({ error: 'Sensor not found' }, { status: 404 });
  }

  const building = await base44.asServiceRole.entities.Building.filter({ 
    id: sensor.building_id 
  }).then(b => b[0]);

  const actions = [];

  // Send notifications
  const emails = sensor.alarm_config?.notification_emails || [];
  
  // Also notify all admins
  const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
  const adminEmails = admins.map(a => a.email);
  const allEmails = [...new Set([...emails, ...adminEmails])];

  for (const email of allEmails) {
    await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
      user_email: email,
      title: `🚨 Sensor-Alarm: ${sensor.sensor_name}`,
      message: `Schwellwert überschritten!\n\nSensor: ${sensor.sensor_name}\nGebäude: ${building?.name || 'Unbekannt'}\nStandort: ${sensor.location}\n\nAktueller Wert: ${value} ${sensor.unit}\nSchwellwert: ${threshold_value} ${sensor.unit}\nTyp: ${threshold_type === 'below_min' ? 'Unter Minimum' : 'Über Maximum'}`,
      type: 'system',
      priority: 'critical',
      related_entity_type: 'sensor',
      related_entity_id: sensor_id
    });

    actions.push({ type: 'notification', recipient: email });
  }

  // Create maintenance task for critical sensor types
  if (['smoke', 'leak', 'temperature'].includes(sensor.sensor_type)) {
    const task = await base44.asServiceRole.entities.BuildingTask.create({
      building_id: sensor.building_id,
      task_title: `DRINGEND: Sensor-Alarm - ${sensor.sensor_name}`,
      description: `Sensor-Alarm ausgelöst!\n\nSensor: ${sensor.sensor_name}\nTyp: ${sensor.sensor_type}\nStandort: ${sensor.location}\nMesswert: ${value} ${sensor.unit}\nSchwellwert: ${threshold_value} ${sensor.unit}`,
      task_type: 'maintenance',
      priority: 'urgent',
      status: 'open',
      source_type: 'notification',
      ai_generated: true
    });

    // Try to auto-assign
    try {
      await base44.asServiceRole.functions.invoke('autoAssignMaintenanceTask', {
        task_id: task.id
      });
      actions.push({ type: 'task_created_and_assigned', task_id: task.id });
    } catch (e) {
      actions.push({ type: 'task_created', task_id: task.id });
    }
  }

  return Response.json({ 
    success: true,
    sensor_name: sensor.sensor_name,
    building: building?.name,
    actions_performed: actions.length,
    actions
  });
});