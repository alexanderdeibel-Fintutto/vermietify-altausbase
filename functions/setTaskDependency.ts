import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id, depends_on_id, remove } = await req.json();

    if (!task_id || !depends_on_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tasks = await base44.entities.BuildingTask.filter({ id: task_id });
    const task = tasks[0];

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    let depends_on = task.depends_on || [];
    let blocked_by = [];

    if (remove) {
      depends_on = depends_on.filter(id => id !== depends_on_id);
    } else {
      if (!depends_on.includes(depends_on_id)) {
        depends_on.push(depends_on_id);
      }

      // Update the other task to add this task to its blocked_by
      const depTasks = await base44.entities.BuildingTask.filter({ id: depends_on_id });
      if (depTasks[0]) {
        blocked_by = depTasks[0].blocked_by || [];
        if (!blocked_by.includes(task_id)) {
          blocked_by.push(task_id);
          await base44.entities.BuildingTask.update(depends_on_id, {
            blocked_by
          });
        }
      }
    }

    // Update task
    const updated = await base44.entities.BuildingTask.update(task_id, {
      depends_on,
      status: depends_on.length > 0 && task.status === 'open' ? 'blocked' : task.status
    });

    return Response.json({ 
      message: remove ? 'Dependency removed' : 'Dependency added',
      task: updated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});