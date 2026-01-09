import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, reason, make_immutable, retention_years } = await req.json();

    if (!document_id) {
      return Response.json({ error: 'document_id required' }, { status: 400 });
    }

    const document = await base44.entities.Document.filter({ id: document_id }, null, 1);
    if (!document[0]) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const updateData = {
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user.email,
      archive_reason: reason || 'Manuelle Archivierung'
    };

    // Calculate retention date if provided
    if (retention_years) {
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + retention_years);
      updateData.retention_until = retentionDate.toISOString().split('T')[0];
    }

    // Make document immutable if requested
    if (make_immutable) {
      const content = document[0].content || document[0].file_url || '';
      const hash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(content + document[0].created_date)
      );
      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      updateData.is_immutable = true;
      updateData.immutable_hash = hashHex;
    }

    await base44.entities.Document.update(document_id, updateData);

    return Response.json({
      success: true,
      message: 'Dokument erfolgreich archiviert',
      archived_at: updateData.archived_at,
      is_immutable: updateData.is_immutable || false
    });

  } catch (error) {
    console.error('Archive document error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});