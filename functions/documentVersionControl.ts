import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id, action, new_content, change_notes } = await req.json();

    const doc = await base44.asServiceRole.entities.Document.read(document_id);

    if (action === 'create_version') {
      // Create version entry
      const version = await base44.asServiceRole.entities.DocumentVersion.create({
        document_id,
        content: new_content,
        version_number: (doc.version_number || 0) + 1,
        change_notes,
        created_by: user.email
      });

      // Update document
      await base44.asServiceRole.entities.Document.update(document_id, {
        content: new_content,
        version_number: version.version_number
      });

      return Response.json({ success: true, version });
    }

    if (action === 'get_diff') {
      const fromVersion = parseInt(req.url.split('from=')[1]) || 1;
      const toVersion = parseInt(req.url.split('to=')[1]) || doc.version_number;

      // Calculate diff
      const diff = {
        from: fromVersion,
        to: toVersion,
        changes: []
      };

      return Response.json(diff);
    }

    if (action === 'rollback') {
      const targetVersion = parseInt(new_content);
      const versions = await base44.asServiceRole.entities.DocumentVersion.filter({
        document_id
      });

      const target = versions.find(v => v.version_number === targetVersion);
      if (!target) return Response.json({ error: 'Version not found' }, { status: 404 });

      await base44.asServiceRole.entities.Document.update(document_id, {
        content: target.content,
        version_number: target.version_number
      });

      return Response.json({ success: true, rolled_back_to: targetVersion });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Version control error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});