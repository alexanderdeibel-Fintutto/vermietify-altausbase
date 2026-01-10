import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tenant_id, message, attachments = [] } = await req.json();

  // Get tenant info
  const tenant = await base44.asServiceRole.entities.Tenant.filter({ 
    id: tenant_id 
  }).then(t => t[0]);
  
  if (!tenant) {
    return Response.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Create reply message
  const replyMessage = await base44.asServiceRole.entities.TenantMessage.create({
    tenant_id,
    tenant_email: tenant.email,
    sender_name: user.full_name || 'Hausverwaltung',
    message,
    direction: 'to_tenant',
    is_read: false,
    attachments
  });

  // Send notification to tenant
  await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
    user_email: tenant.email,
    title: 'Neue Nachricht von Ihrer Hausverwaltung',
    message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
    type: 'message',
    priority: 'normal',
    related_entity_type: 'tenant_message',
    related_entity_id: replyMessage.id
  });

  return Response.json({ 
    success: true, 
    message_id: replyMessage.id
  });
});