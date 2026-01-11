import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, folder_path = '' } = await req.json();
    const accessToken = Deno.env.get('DROPBOX_ACCESS_TOKEN');

    if (!accessToken) {
      return Response.json({ error: 'Dropbox not connected' }, { status: 400 });
    }

    // List files
    const filesRes = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: folder_path || '' })
    });

    const { entries } = await filesRes.json();
    const imported = [];

    for (const file of entries || []) {
      if (file['.tag'] !== 'file') continue;

      // Download file
      const downloadRes = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: file.path_display })
        }
      });

      const content = await downloadRes.text();

      const doc = await base44.asServiceRole.entities.Document.create({
        company_id,
        name: file.name,
        content,
        document_type: file.name.endsWith('.pdf') ? 'pdf' : 'document',
        tags: ['dropbox', 'imported'],
        metadata: {
          dropbox_id: file.id,
          dropbox_path: file.path_display
        }
      });

      imported.push(doc);
    }

    return Response.json({ success: true, imported: imported.length });
  } catch (error) {
    console.error('Dropbox sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});