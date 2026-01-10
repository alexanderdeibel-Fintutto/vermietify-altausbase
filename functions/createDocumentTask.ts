import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, company_id, title, description, task_type, assigned_to, due_date, priority } = await req.json();

    // Create task
    const task = await base44.asServiceRole.entities.DocumentTask.create({
      document_id,
      company_id,
      title,
      description,
      task_type,
      assigned_to,
      assigned_by: user.email,
      priority,
      due_date,
      status: 'open'
    });

    // Update document audit trail
    const docs = await base44.asServiceRole.entities.Document.filter({ id: document_id });
    if (docs.length > 0) {
      const doc = docs[0];
      const updatedAuditTrail = [
        ...(doc.audit_trail || []),
        {
          action: 'task_created',
          actor: user.email,
          timestamp: new Date().toISOString(),
          details: `Aufgabe erstellt: ${title} (zugewiesen an ${assigned_to})`
        }
      ];
      await base44.asServiceRole.entities.Document.update(document_id, {
        audit_trail: updatedAuditTrail
      });
    }

    // Send notification to assignee
    try {
      const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: `@${assigned_to.split('@')[0]}`,
          text: `📋 Neue Aufgabe zugewiesen: ${title}`,
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${title}*\n${description || ''}\n*Priorität:* ${priority}\n*Fällig:* ${due_date ? new Date(due_date).toLocaleDateString('de-DE') : 'N/A'}`
            }
          }]
        })
      });
    } catch (error) {
      console.log('Slack notification optional');
    }

    return Response.json({ success: true, task_id: task.id });
  } catch (error) {
    console.error('Create task error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});