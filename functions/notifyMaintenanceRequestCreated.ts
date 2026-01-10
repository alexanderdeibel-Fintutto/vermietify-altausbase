import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { maintenance_request_id } = await req.json();

  const request = await base44.asServiceRole.entities.MaintenanceTask.filter({ 
    id: maintenance_request_id 
  }).then(r => r[0]);

  if (!request) {
    return Response.json({ error: 'Request not found' }, { status: 404 });
  }

  // Get tenant info
  const tenant = request.tenant_id
    ? await base44.asServiceRole.entities.Tenant.filter({ id: request.tenant_id }).then(t => t[0])
    : null;

  // Notify all admins
  const users = await base44.asServiceRole.entities.User.list();
  const admins = users.filter(u => u.role === 'admin');

  for (const admin of admins) {
    await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
      user_email: admin.email,
      title: 'Neue Wartungsanfrage',
      message: `${tenant ? tenant.first_name + ' ' + tenant.last_name : 'Ein Mieter'} hat eine neue Wartungsanfrage erstellt: ${request.title}`,
      type: 'maintenance',
      priority: request.priority === 'urgent' ? 'critical' : 'normal',
      related_entity_type: 'maintenance',
      related_entity_id: request.id
    });
  }

  // Confirm to tenant
  if (tenant?.email) {
    await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
      user_email: tenant.email,
      title: 'Wartungsanfrage eingegangen',
      message: `Ihre Wartungsanfrage "${request.title}" wurde erfolgreich erstellt und wird bearbeitet.`,
      type: 'maintenance',
      priority: 'normal',
      related_entity_type: 'maintenance',
      related_entity_id: request.id
    });
  }

  return Response.json({ 
    success: true, 
    admins_notified: admins.length,
    tenant_notified: !!tenant
  });
});