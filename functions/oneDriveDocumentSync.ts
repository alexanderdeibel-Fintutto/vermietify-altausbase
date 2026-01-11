import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, folder_path = '/Documents' } = await req.json();
    const accessToken = Deno.env.get('ONEDRIVE_ACCESS_TOKEN');

    if (!accessToken) {
      return Response.json({ error: 'OneDrive not connected' }, { status: 400 });
    }

    // List files
    const filesRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${folder_path}:/children`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    const { value: files } = await filesRes.json();
    const imported = [];

    for (const file of files || []) {
      // Download file
      const contentRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      const content = await contentRes.text();

      const doc = await base44.asServiceRole.entities.Document.create({
        company_id,
        name: file.name,
        content,
        document_type: file.name.endsWith('.pdf') ? 'pdf' : 'document',
        tags: ['onedrive', 'imported'],
        metadata: {
          onedrive_id: file.id,
          size: file.size
        }
      });

      imported.push(doc);
    }

    return Response.json({ success: true, imported: imported.length });
  } catch (error) {
    console.error('OneDrive sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});