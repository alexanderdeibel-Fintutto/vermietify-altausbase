import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { document_id, tenant_id } = await req.json();

  const document = await base44.asServiceRole.entities.Document.filter({ 
    id: document_id 
  }).then(d => d[0]);

  if (!document) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }

  // Notify tenant if document is linked to them
  if (tenant_id) {
    const tenant = await base44.asServiceRole.entities.Tenant.filter({ 
      id: tenant_id 
    }).then(t => t[0]);

    if (tenant?.email) {
      await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
        user_email: tenant.email,
        title: 'Neues Dokument verfügbar',
        message: `Ein neues Dokument wurde hochgeladen: ${document.name}`,
        type: 'document',
        priority: 'normal',
        related_entity_type: 'document',
        related_entity_id: document.id
      });
    }
  }

  // Notify admins for important documents
  if (document.category === 'Mietrecht' || document.status === 'unterschrieben') {
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === 'admin');

    for (const admin of admins) {
      await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
        user_email: admin.email,
        title: 'Wichtiges Dokument hochgeladen',
        message: `Dokument "${document.name}" (${document.category}) wurde hochgeladen.`,
        type: 'document',
        priority: 'high',
        related_entity_type: 'document',
        related_entity_id: document.id
      });
    }
  }

  return Response.json({ success: true });
});