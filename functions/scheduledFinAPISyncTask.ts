import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function is called by a scheduled task daily
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all users with FinAPI enabled
    const profiles = await base44.asServiceRole.entities.TaxProfile.filter({
      finapi_connected: true
    });

    let synced = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        // Sync assets for this user
        await base44.asServiceRole.functions.invoke('finapiSyncAssets', {
          finapi_user_id: profile.user_email
        });
        synced++;
      } catch (e) {
        errors++;
        console.error(`FinAPI sync failed for ${profile.user_email}:`, e);
      }
    }

    return Response.json({
      total_users: profiles.length,
      synced,
      errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});