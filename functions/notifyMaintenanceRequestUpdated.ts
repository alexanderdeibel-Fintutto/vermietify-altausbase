import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { maintenance_request_id, status } = await req.json();

  const request = await base44.asServiceRole.entities.MaintenanceTask.filter({ 
    id: maintenance_request_id 
  }).then(r => r[0]);

  if (!request || !request.tenant_id) {
    return Response.json({ error: 'Request or tenant not found' }, { status: 404 });
  }

  const tenant = await base44.asServiceRole.entities.Tenant.filter({ 
    id: request.tenant_id 
  }).then(t => t[0]);

  if (!tenant?.email) {
    return Response.json({ error: 'Tenant email not found' }, { status: 404 });
  }

  const statusMessages = {
    assigned: 'Ihre Wartungsanfrage wurde zugewiesen und wird bearbeitet.',
    in_progress: 'Die Bearbeitung Ihrer Wartungsanfrage hat begonnen.',
    completed: 'Ihre Wartungsanfrage wurde erfolgreich abgeschlossen.',
    cancelled: 'Ihre Wartungsanfrage wurde abgebrochen.'
  };

  await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
    user_email: tenant.email,
    title: `Wartungsanfrage: ${request.title}`,
    message: statusMessages[status] || 'Der Status Ihrer Wartungsanfrage wurde aktualisiert.',
    type: 'maintenance',
    priority: status === 'completed' ? 'low' : 'normal',
    related_entity_type: 'maintenance',
    related_entity_id: request.id
  });

  return Response.json({ success: true });
});