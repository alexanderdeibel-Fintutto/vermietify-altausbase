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
      file_url,
      file_name,
      file_size,
      change_notes
    } = await req.json();

    // Get the document
    const docs = await base44.entities.Document.filter({ id: document_id });
    if (docs.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = docs[0];

    // Get latest version number
    const versions = await base44.asServiceRole.entities.DocumentVersion.filter(
      { document_id },
      '-version_number',
      1
    );
    const latestVersion = versions[0]?.version_number || 0;
    const newVersionNumber = latestVersion + 1;

    // Mark previous version as not current
    if (versions.length > 0) {
      await base44.asServiceRole.entities.DocumentVersion.update(versions[0].id, {
        is_current: false
      });
    }

    // Create new version
    const version = await base44.asServiceRole.entities.DocumentVersion.create({
      document_id,
      company_id: doc.company_id,
      file_url,
      file_name: file_name || doc.name,
      file_size,
      version_number: newVersionNumber,
      uploaded_by: user.email,
      change_notes,
      is_current: true
    });

    // Update document to point to new version
    await base44.asServiceRole.entities.Document.update(document_id, {
      url: file_url,
      current_version: newVersionNumber
    });

    // Log in audit trail
    await base44.functions.invoke('sendNotification', {
      recipient_email: user.email,
      title: `✅ Version ${newVersionNumber} hochgeladen`,
      message: `${file_name || doc.name} - Version ${newVersionNumber} erfolgreich erstellt.`,
      notification_type: 'document_event',
      related_entity_type: 'document',
      related_entity_id: document_id,
      priority: 'low'
    });

    return Response.json({ 
      success: true, 
      version_id: version.id, 
      version_number: newVersionNumber 
    });
  } catch (error) {
    console.error('Upload version error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});