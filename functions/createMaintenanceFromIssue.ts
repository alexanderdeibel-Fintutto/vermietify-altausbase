import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { issue_id } = await req.json();

  const issue = await base44.asServiceRole.entities.TenantIssueReport.filter({ 
    id: issue_id 
  }).then(i => i[0]);

  if (!issue) {
    return Response.json({ error: 'Issue not found' }, { status: 404 });
  }

  // Map issue severity to maintenance priority
  const priorityMap = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'urgent'
  };

  // Map issue type to maintenance category
  const categoryMap = {
    heating: 'heating',
    plumbing: 'plumbing',
    electrical: 'electrical',
    appliance: 'general',
    temperature: 'heating',
    humidity: 'general',
    noise: 'general',
    other: 'general'
  };

  let description = `Mieter-Meldung: ${issue.description}`;
  
  if (issue.related_sensor_id && issue.sensor_reading_value) {
    const sensor = await base44.asServiceRole.entities.IoTSensor.filter({ 
      id: issue.related_sensor_id 
    }).then(s => s[0]);
    
    if (sensor) {
      description += `\n\nSensor-Daten:\n- ${sensor.sensor_name}: ${issue.sensor_reading_value} ${sensor.unit}\n- Standort: ${sensor.location}`;
    }
  }

  const task = await base44.asServiceRole.entities.MaintenanceTask.create({
    title: issue.title,
    description,
    category: categoryMap[issue.issue_type] || 'general',
    priority: priorityMap[issue.severity] || 'medium',
    status: 'pending',
    building_id: issue.building_id,
    unit_id: issue.unit_id,
    tenant_id: issue.tenant_id,
    attachments: issue.photos || []
  });

  // Update issue with task reference
  await base44.asServiceRole.entities.TenantIssueReport.update(issue_id, {
    maintenance_task_id: task.id,
    status: 'acknowledged'
  });

  // Try to auto-assign
  let assigned = false;
  try {
    const assignResult = await base44.asServiceRole.functions.invoke('autoAssignMaintenanceTask', {
      task_id: task.id
    });
    assigned = assignResult.data.success;
  } catch (e) {
    // Assignment failed, task remains unassigned
  }

  // Notify admins
  const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
  for (const admin of admins) {
    await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
      user_email: admin.email,
      title: 'Neue Mieter-Störungsmeldung',
      message: `${issue.title}\n\nSchweregrad: ${issue.severity}\nTyp: ${issue.issue_type}`,
      type: 'maintenance',
      priority: issue.severity === 'critical' ? 'critical' : 'high',
      related_entity_type: 'issue',
      related_entity_id: issue_id
    });
  }

  return Response.json({ 
    success: true,
    task_id: task.id,
    auto_assigned: assigned
  });
});