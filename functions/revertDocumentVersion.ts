import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { version_id, document_id, company_id } = await req.json();

    // Get version
    const versionQuery = await base44.asServiceRole.entities.DocumentVersion.filter({
      id: version_id
    });
    if (versionQuery.length === 0) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }
    const version = versionQuery[0];

    // Get document
    const docs = await base44.asServiceRole.entities.Document.filter({ id: document_id });
    if (docs.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = docs[0];

    // Mark all versions as not current
    const allVersions = await base44.asServiceRole.entities.DocumentVersion.filter({
      document_id
    });
    for (const v of allVersions.filter(v => v.is_current)) {
      await base44.asServiceRole.entities.DocumentVersion.update(v.id, {
        is_current: false
      });
    }

    // Mark reverted version as current
    await base44.asServiceRole.entities.DocumentVersion.update(version_id, {
      is_current: true
    });

    // Update document
    await base44.asServiceRole.entities.Document.update(document_id, {
      url: version.file_url,
      updated_date: new Date().toISOString()
    });

    // Log metric
    await base44.asServiceRole.entities.DocumentAnalytics.create({
      company_id,
      metric_type: 'document_reverted',
      date: new Date().toISOString().split('T')[0],
      count: 1,
      details: { document_id, reverted_to_version: version.version_number }
    });

    // Update signature requests audit trail
    const signatureRequests = await base44.asServiceRole.entities.SignatureRequest.filter({
      document_id
    });

    for (const sr of signatureRequests) {
      const updatedAuditTrail = [
        ...sr.audit_trail,
        {
          action: 'document_reverted',
          actor: user.email,
          timestamp: new Date().toISOString(),
          details: `Zurückgewechselt zu Version ${version.version_number}`
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
          text: `⏮️ Dokument zurückgesetzt: ${doc.name}`,
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Zurückgesetzt auf Version ${version.version_number}*\n*Dokument:* ${doc.name}\n*Aktualisiert von:* ${user.full_name}`
            }
          }]
        })
      });
    } catch (error) {
      console.log('Slack notification optional');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Revert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});