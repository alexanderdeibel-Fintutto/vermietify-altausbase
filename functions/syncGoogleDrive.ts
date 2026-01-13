import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderId, entityType } = await req.json();

    // Get Google Drive access token
    const driveToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    if (!driveToken) {
      return Response.json({ error: 'Google Drive not connected' }, { status: 400 });
    }

    // Fetch files from Google Drive folder
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&spaces=drive`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${driveToken}`
        }
      }
    );

    const driveFiles = await response.json();
    const files = driveFiles.files || [];

    // Link files to entities
    let linked = 0;
    for (const file of files) {
      try {
        // Store file reference
        await base44.entities.Document?.create?.({
          title: file.name,
          google_drive_id: file.id,
          url: file.webViewLink,
          entity_type: entityType,
          synced_at: new Date()
        });
        linked++;
      } catch (e) {
        console.error('Error linking file:', e);
      }
    }

    return Response.json({
      success: true,
      files_synced: linked,
      total_files: files.length
    });

  } catch (error) {
    console.error('Google Drive sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});