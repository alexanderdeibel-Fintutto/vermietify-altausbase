import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id, title, description, category, priority, attachments } = await req.json();

    // Create maintenance task
    const task = await base44.asServiceRole.entities.MaintenanceTask.create({
      tenant_id,
      title,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'pending',
      attachments: attachments || []
    });

    // Create notification for admins
    await base44.asServiceRole.entities.Notification.create({
      user_email: 'admin@example.com', // Replace with actual admin emails
      title: 'Neue Wartungsanfrage',
      message: `${title} - von Mieter`,
      type: 'maintenance',
      priority: priority || 'normal',
      related_entity_type: 'maintenance_task',
      related_entity_id: task.id
    });

    // Auto-create building task using AI
    try {
      await base44.asServiceRole.functions.invoke('createSmartTask', {
        source_type: 'maintenance_request',
        source_id: task.id,
        source_data: task
      });
    } catch (error) {
      console.error('Smart task creation failed:', error);
    }

    return Response.json({
      success: true,
      task
    });

  } catch (error) {
    console.error('Create maintenance request error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});