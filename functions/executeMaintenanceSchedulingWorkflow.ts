import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { 
    workflow_id, 
    maintenance_type = 'inspection',
    interval_months = 6,
    building_ids = []
  } = await req.json();

  const results = [];
  const buildings = building_ids.length > 0
    ? await base44.asServiceRole.entities.Building.filter({ id: { $in: building_ids } })
    : await base44.asServiceRole.entities.Building.list();

  for (const building of buildings) {
    // Check last maintenance of this type
    const lastMaintenance = await base44.asServiceRole.entities.BuildingTask.filter({
      building_id: building.id,
      task_type: maintenance_type,
      status: 'completed'
    }, '-completed_at', 1);

    const shouldSchedule = !lastMaintenance[0] || (() => {
      const lastDate = new Date(lastMaintenance[0].completed_at);
      const monthsSince = (new Date() - lastDate) / (1000 * 60 * 60 * 24 * 30);
      return monthsSince >= interval_months;
    })();

    if (shouldSchedule) {
      const task = await base44.asServiceRole.entities.BuildingTask.create({
        building_id: building.id,
        task_title: `${maintenance_type === 'inspection' ? 'Inspektion' : 'Wartung'} - ${building.name}`,
        description: `Geplante ${maintenance_type}-Aufgabe für ${building.name}`,
        task_type: maintenance_type,
        priority: 'medium',
        status: 'open',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Try to auto-assign if workflow configured
      try {
        await base44.asServiceRole.functions.invoke('autoAssignMaintenanceTask', {
          task_id: task.id
        });
      } catch (e) {
        // Assignment failed, task remains unassigned
      }

      results.push({
        building: building.name,
        task_id: task.id,
        type: maintenance_type
      });
    }
  }

  return Response.json({ 
    success: true, 
    tasks_created: results.length,
    scheduled_tasks: results
  });
});