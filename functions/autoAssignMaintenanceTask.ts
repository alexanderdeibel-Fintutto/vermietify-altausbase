import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { task_id, building_id } = await req.json();

    if (!task_id) {
      return Response.json({ error: 'Missing task_id' }, { status: 400 });
    }

    // Get task
    const tasks = await base44.asServiceRole.entities.BuildingTask.filter({ id: task_id });
    const task = tasks[0];

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get building managers
    const managers = await base44.asServiceRole.entities.BuildingManager.filter({ 
      building_id: task.building_id || building_id 
    });

    // Find best manager based on task type and specialization
    let bestManager = null;
    if (managers.length > 0) {
      // Sort by priority/rating
      bestManager = managers.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    }

    if (!bestManager && managers.length > 0) {
      bestManager = managers[0];
    }

    // Assign task
    if (bestManager) {
      await base44.asServiceRole.entities.BuildingTask.update(task_id, {
        assigned_to: bestManager.email,
        assigned_role: 'building_manager',
        status: 'assigned'
      });

      // Notify manager
      await base44.asServiceRole.entities.Notification.create({
        user_email: bestManager.email,
        title: 'Neue Aufgabe zugewiesen',
        message: `Aufgabe "${task.task_title}" wurde Ihnen zugewiesen`,
        type: 'task_assignment',
        action_type: 'task',
        action_id: task_id,
        priority: task.priority,
        is_read: false
      });

      return Response.json({ 
        message: 'Task assigned',
        manager: bestManager.email,
        task_id
      });
    }

    return Response.json({ 
      message: 'No manager available',
      task_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});