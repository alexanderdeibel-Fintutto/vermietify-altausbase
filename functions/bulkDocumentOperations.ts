import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, document_ids, action, parameters } = await req.json();

    const results = {
      successful: [],
      failed: []
    };

    for (const docId of document_ids) {
      try {
        if (action === 'add_tags') {
          const doc = await base44.asServiceRole.entities.Document.read(docId);
          const newTags = [...(doc.tags || []), ...parameters.tags];
          await base44.asServiceRole.entities.Document.update(docId, {
            tags: [...new Set(newTags)]
          });
          results.successful.push(docId);
        }

        if (action === 'change_type') {
          await base44.asServiceRole.entities.Document.update(docId, {
            document_type: parameters.new_type
          });
          results.successful.push(docId);
        }

        if (action === 'archive') {
          const doc = await base44.asServiceRole.entities.Document.read(docId);
          await base44.asServiceRole.entities.DocumentArchive.create({
            document_id: docId,
            original_data: doc
          });
          await base44.asServiceRole.entities.Document.delete(docId);
          results.successful.push(docId);
        }

        if (action === 'share') {
          // Create share records
          for (const email of parameters.emails) {
            await base44.asServiceRole.entities.DocumentPermission.create({
              document_id: docId,
              user_email: email,
              permission: 'view'
            });
          }
          results.successful.push(docId);
        }
      } catch (err) {
        results.failed.push({ docId, error: err.message });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Bulk operations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});