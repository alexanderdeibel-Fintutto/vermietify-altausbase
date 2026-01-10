import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, company_id, file, change_notes } = await req.json();

    // Get document
    const documents = await base44.asServiceRole.entities.Document.filter({ id: document_id });
    if (documents.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = documents[0];

    // Get current version count
    const versions = await base44.asServiceRole.entities.DocumentVersion.filter({
      document_id
    });

    const nextVersionNumber = versions.length + 1;

    // Upload file
    const uploadResult = await base44.integrations.Core.UploadFile({ file });

    // Create version record
    const version = await base44.asServiceRole.entities.DocumentVersion.create({
      document_id,
      company_id,
      file_url: uploadResult.file_url,
      version_number: nextVersionNumber,
      file_name: doc.name,
      uploaded_by: user.email,
      change_notes,
      is_current: true
    });

    // Mark previous versions as not current
    for (const v of versions.filter(v => v.is_current)) {
      await base44.asServiceRole.entities.DocumentVersion.update(v.id, {
        is_current: false
      });
    }

    // Update original document
    await base44.asServiceRole.entities.Document.update(document_id, {
      url: uploadResult.file_url,
      updated_date: new Date().toISOString()
    });

    // Log to analytics
    await base44.asServiceRole.entities.DocumentAnalytics.create({
      company_id,
      metric_type: 'document_versioned',
      date: new Date().toISOString().split('T')[0],
      count: 1,
      details: { document_id, version_number: nextVersionNumber }
    });

    // Update signature requests audit trail
    const signatureRequests = await base44.asServiceRole.entities.SignatureRequest.filter({
      document_id
    });

    for (const sr of signatureRequests) {
      const updatedAuditTrail = [
        ...sr.audit_trail,
        {
          action: 'document_version_uploaded',
          actor: user.email,
          timestamp: new Date().toISOString(),
          details: `Version ${nextVersionNumber} hochgeladen${change_notes ? ': ' + change_notes : ''}`
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
          text: `📝 Neue Dokumentversion: ${doc.name}`,
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Version ${nextVersionNumber}*\n*Dokument:* ${doc.name}\n*Hochgeladen von:* ${user.full_name}${change_notes ? `\n*Änderungen:* ${change_notes}` : ''}`
            }
          }]
        })
      });
    } catch (error) {
      console.log('Slack notification optional');
    }

    return Response.json({ success: true, version_id: version.id, version_number: nextVersionNumber });
  } catch (error) {
    console.error('Upload version error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});