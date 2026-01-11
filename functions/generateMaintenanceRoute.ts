import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { route_id } = await req.json();
    const route = await base44.asServiceRole.entities.MaintenanceRoute.read(route_id);

    const tasks = [];
    for (const buildingId of route.buildings) {
      const building = await base44.asServiceRole.entities.Building.read(buildingId);
      
      for (const item of route.checklist_items) {
        tasks.push({
          building_name: building.name,
          building_id: buildingId,
          task: item.task,
          priority: item.priority,
          estimated_minutes: item.estimated_minutes,
          completed: false
        });
      }
    }

    return Response.json({ 
      success: true, 
      route_name: route.name,
      total_tasks: tasks.length,
      tasks,
      assigned_to: route.assigned_to
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});