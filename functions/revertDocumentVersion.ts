import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      document_id,
      version_id,
      reason = 'Manual revert'
    } = await req.json();

    // Get the version
    const versions = await base44.asServiceRole.entities.DocumentVersion.filter({ id: version_id });
    if (versions.length === 0) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }
    const targetVersion = versions[0];

    // Verify it belongs to correct document
    if (targetVersion.document_id !== document_id) {
      return Response.json({ error: 'Version does not belong to document' }, { status: 400 });
    }

    // Get document
    const docs = await base44.entities.Document.filter({ id: document_id });
    if (docs.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = docs[0];

    // Create backup of current version before reverting
    const currentVersions = await base44.asServiceRole.entities.DocumentVersion.filter(
      { document_id, is_current: true }
    );
    if (currentVersions.length > 0) {
      await base44.asServiceRole.entities.DocumentVersion.update(
        currentVersions[0].id,
        { is_current: false }
      );
    }

    // Create new version from the reverted content
    const maxVersionNumber = Math.max(
      ...currentVersions.map(v => v.version_number),
      targetVersion.version_number
    );

    const newVersion = await base44.asServiceRole.entities.DocumentVersion.create({
      document_id,
      company_id: doc.company_id,
      file_url: targetVersion.file_url,
      file_name: targetVersion.file_name,
      file_size: targetVersion.file_size,
      version_number: maxVersionNumber + 1,
      uploaded_by: user.email,
      change_notes: `Reverted from version ${targetVersion.version_number}. Reason: ${reason}`,
      is_current: true
    });

    // Update document
    await base44.asServiceRole.entities.Document.update(document_id, {
      url: targetVersion.file_url,
      current_version: maxVersionNumber + 1
    });

    // Send notification
    await base44.functions.invoke('sendNotification', {
      recipient_email: user.email,
      title: `⏮️ Version zurückgesetzt`,
      message: `"${doc.name}" wurde auf Version ${targetVersion.version_number} zurückgesetzt (neue Version: ${maxVersionNumber + 1}).`,
      notification_type: 'document_event',
      related_entity_type: 'document',
      related_entity_id: document_id,
      priority: 'medium'
    });

    return Response.json({ 
      success: true, 
      new_version_id: newVersion.id,
      new_version_number: maxVersionNumber + 1
    });
  } catch (error) {
    console.error('Revert version error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});