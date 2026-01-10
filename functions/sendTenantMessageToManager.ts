import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tenant_id, subject, message, attachments = [] } = await req.json();

  // Get tenant info
  const tenant = await base44.entities.Tenant.filter({ id: tenant_id }).then(t => t[0]);
  
  if (!tenant) {
    return Response.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Create message record
  const tenantMessage = await base44.entities.TenantMessage.create({
    tenant_id,
    tenant_email: tenant.email,
    sender_name: `${tenant.first_name} ${tenant.last_name}`,
    message: `**Betreff: ${subject}**\n\n${message}`,
    direction: 'from_tenant',
    is_read: false,
    attachments
  });

  // Get all admins
  const users = await base44.asServiceRole.entities.User.list();
  const admins = users.filter(u => u.role === 'admin');

  // Send notifications to all admins
  for (const admin of admins) {
    await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
      user_email: admin.email,
      title: `Neue Nachricht von ${tenant.first_name} ${tenant.last_name}`,
      message: `Betreff: ${subject}\n\n${message.substring(0, 200)}${message.length > 200 ? '...' : ''}`,
      type: 'message',
      priority: 'normal',
      related_entity_type: 'tenant_message',
      related_entity_id: tenantMessage.id
    });
  }

  return Response.json({ 
    success: true, 
    message_id: tenantMessage.id,
    notified_admins: admins.length
  });
});