import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id } = await req.json();

    const documents = await base44.entities.Document.filter({ id: document_id });
    if (documents.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = documents[0];

    // Erstelle signed URL für den Download
    const signedUrl = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: doc.file_path
    });

    console.log('[DOWNLOAD] Document:', doc.name);

    return Response.json({
      success: true,
      signed_url: signedUrl.signed_url,
      file_name: doc.name
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});