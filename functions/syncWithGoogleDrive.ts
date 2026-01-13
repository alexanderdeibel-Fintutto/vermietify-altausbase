import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityTypes, autoSync } = await req.json();

    // Get Google Drive access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    if (!accessToken) {
      return Response.json({ error: 'Google Drive not authorized' }, { status: 401 });
    }

    let syncedCount = 0;

    // Sync each entity type
    for (const entityType of entityTypes) {
      const entities = await base44.entities[entityType]?.list?.('-updated_date', 20) || [];

      for (const entity of entities) {
        // Upload to Google Drive
        const fileName = `${entityType}_${entity.id}_${new Date().toISOString().split('T')[0]}`;

        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: fileName,
            mimeType: 'application/json',
            parents: ['root'] // In production, use specific folder
          })
        });

        if (uploadResponse.ok) {
          syncedCount++;
        }
      }
    }

    // Save sync config
    if (autoSync) {
      // Schedule automatic syncs
    }

    return Response.json({
      data: {
        synced: syncedCount,
        autoSync: autoSync
      }
    });

  } catch (error) {
    console.error('Google Drive sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});