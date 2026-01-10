import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id, updates } = await req.json();

    // Get task
    const tasks = await base44.asServiceRole.entities.DocumentTask.filter({ id: task_id });
    if (tasks.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }
    const task = tasks[0];

    const updateData = { ...updates };

    // Handle status change to completed
    if (updates.status === 'completed' && task.status !== 'completed') {
      updateData.completed_date = new Date().toISOString();
      updateData.completed_by = user.email;
    }

    // Update task
    await base44.asServiceRole.entities.DocumentTask.update(task_id, updateData);

    // Update document audit trail
    const docs = await base44.asServiceRole.entities.Document.filter({ id: task.document_id });
    if (docs.length > 0) {
      const doc = docs[0];
      const updatedAuditTrail = [
        ...(doc.audit_trail || []),
        {
          action: 'task_updated',
          actor: user.email,
          timestamp: new Date().toISOString(),
          details: `Aufgabe aktualisiert: ${task.title} - Status: ${updates.status || task.status}`
        }
      ];
      await base44.asServiceRole.entities.Document.update(task.document_id, {
        audit_trail: updatedAuditTrail
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update task error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});