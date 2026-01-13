import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, entityType, entityId, approverEmail, changeData } = await req.json();

    const approval = await base44.entities.Approval?.create?.({
      request_title: title,
      entity_type: entityType,
      entity_id: entityId,
      requester_email: user.email,
      approver_email: approverEmail,
      status: 'pending',
      change_data: JSON.stringify(changeData),
      submitted_at: new Date().toISOString()
    });

    // Send notification to approver
    try {
      await base44.integrations.Core.SendEmail({
        to: approverEmail,
        subject: `Genehmigung erforderlich: ${title}`,
        body: `<h2>${title}</h2><p>Von: ${user.email}</p><p>Bitte überprüfen und genehmigen.</p>`
      });
    } catch (e) {
      console.error('Email error:', e);
    }

    return Response.json({ data: approval });
  } catch (error) {
    console.error('Approval request error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});