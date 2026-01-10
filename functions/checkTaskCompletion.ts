import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { completed_task_id } = await req.json();

    if (!completed_task_id) {
      return Response.json({ error: 'Missing task_id' }, { status: 400 });
    }

    // Get completed task
    const completedTasks = await base44.entities.BuildingTask.filter({ id: completed_task_id });
    const completedTask = completedTasks[0];

    if (!completedTask || !completedTask.blocked_by || completedTask.blocked_by.length === 0) {
      return Response.json({ message: 'No blocked tasks' });
    }

    // Check which blocked tasks can now be unblocked
    const unblocked = [];

    for (const blockedTaskId of completedTask.blocked_by) {
      const blockedTasks = await base44.entities.BuildingTask.filter({ id: blockedTaskId });
      const blockedTask = blockedTasks[0];

      if (!blockedTask || !blockedTask.depends_on) continue;

      // Check if all dependencies are completed
      const deps = await Promise.all(
        blockedTask.depends_on.map(depId => 
          base44.entities.BuildingTask.filter({ id: depId })
        )
      );

      const allDepsCompleted = deps.every(depArray => {
        const dep = depArray[0];
        return dep && dep.status === 'completed';
      });

      // Unblock if all dependencies are done
      if (allDepsCompleted) {
        await base44.entities.BuildingTask.update(blockedTaskId, {
          status: 'open'
        });
        unblocked.push(blockedTaskId);

        // Create notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: blockedTask.assigned_to || user.email,
          title: 'Task ist nun verfügbar',
          message: `Die Task "${blockedTask.task_title}" ist nun bereit zur Bearbeitung`,
          type: 'task_unblocked',
          priority: 'high',
          action_type: 'task',
          action_id: blockedTaskId,
          is_read: false
        });
      }
    }

    return Response.json({ 
      message: 'Task completion checked',
      unblocked_count: unblocked.length,
      unblocked_tasks: unblocked
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});