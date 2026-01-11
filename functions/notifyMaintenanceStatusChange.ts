import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { maintenance_task_id, new_status } = await req.json();
    
    const task = await base44.asServiceRole.entities.MaintenanceTask.read(maintenance_task_id);
    
    const statusMessages = {
      'in_progress': {
        title: 'Wartungsanfrage wird bearbeitet',
        message: `Ihre Anfrage "${task.title}" wird jetzt bearbeitet.`,
        priority: 'medium'
      },
      'completed': {
        title: 'Wartung abgeschlossen',
        message: `Die Wartung "${task.title}" wurde erfolgreich abgeschlossen. Bitte bewerten Sie den Service.`,
        priority: 'high'
      }
    };
    
    if (statusMessages[new_status]) {
      await base44.asServiceRole.entities.TenantNotification.create({
        tenant_id: task.tenant_id,
        company_id: task.company_id,
        notification_type: 'maintenance_update',
        title: statusMessages[new_status].title,
        message: statusMessages[new_status].message,
        related_entity_id: maintenance_task_id,
        priority: statusMessages[new_status].priority,
        is_read: false,
        sent_at: new Date().toISOString()
      });
    }
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});