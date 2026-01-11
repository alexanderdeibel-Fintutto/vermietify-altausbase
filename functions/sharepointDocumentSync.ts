import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, site_id, library_name = 'Documents' } = await req.json();
    const accessToken = Deno.env.get('SHAREPOINT_ACCESS_TOKEN');

    if (!accessToken) {
      return Response.json({ error: 'SharePoint not connected' }, { status: 400 });
    }

    // List files from SharePoint library
    const filesRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site_id}/drive/root:/${library_name}:/children`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    const { value: files } = await filesRes.json();
    const imported = [];

    for (const file of files || []) {
      if (file.folder) continue; // Skip folders

      // Download file
      const contentRes = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${site_id}/drive/items/${file.id}/content`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      const content = await contentRes.text();

      const doc = await base44.asServiceRole.entities.Document.create({
        company_id,
        name: file.name,
        content,
        document_type: file.name.endsWith('.pdf') ? 'pdf' : 'document',
        tags: ['sharepoint', 'imported'],
        metadata: {
          sharepoint_id: file.id,
          sharepoint_url: file.webUrl
        }
      });

      imported.push(doc);
    }

    return Response.json({ success: true, imported: imported.length });
  } catch (error) {
    console.error('SharePoint sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});