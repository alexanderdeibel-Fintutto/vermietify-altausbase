import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { archive_id } = await req.json();

    // Get archive record
    const archives = await base44.asServiceRole.entities.DocumentArchive.filter({
      id: archive_id
    });

    if (archives.length === 0) {
      return Response.json({ error: 'Archive record not found' }, { status: 404 });
    }

    const archive = archives[0];

    // Update archive record
    await base44.asServiceRole.entities.DocumentArchive.update(archive_id, {
      restored: true,
      restored_date: new Date().toISOString(),
      restored_by: user.email
    });

    // Log metric
    await base44.asServiceRole.entities.DocumentAnalytics.create({
      company_id: archive.company_id,
      metric_type: 'document_restored',
      date: new Date().toISOString().split('T')[0],
      count: 1,
      details: { document_id: archive.document_id }
    });

    // Update signature requests if any
    const signatureRequests = await base44.asServiceRole.entities.SignatureRequest.filter({
      document_id: archive.document_id
    });

    for (const sr of signatureRequests) {
      const updatedAuditTrail = [
        ...sr.audit_trail,
        {
          action: 'document_restored',
          actor: user.email,
          timestamp: new Date().toISOString(),
          details: 'Dokument aus Archiv wiederhergestellt'
        }
      ];
      await base44.asServiceRole.entities.SignatureRequest.update(sr.id, {
        audit_trail: updatedAuditTrail
      });
    }

    // Notify via Slack
    try {
      const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: '#documents',
          text: `📂 Dokument wiederhergestellt: ${archive.document_name}`,
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Dokument wiederhergestellt*\n*Name:* ${archive.document_name}\n*Von:* ${user.full_name}`
            }
          }]
        })
      });
    } catch (error) {
      console.log('Slack notification optional');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Restore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});