import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId } = await req.json();

    console.log(`Starting FinAPI sync for user ${userId}`);

    // Get FinAPI connection
    const syncs = await base44.asServiceRole.entities.FinAPISync.filter({
      user_id: userId,
      is_connected: true
    });

    if (syncs.length === 0) {
      return Response.json({ error: 'No FinAPI connection found' }, { status: 404 });
    }

    const sync = syncs[0];
    const clientId = Deno.env.get('FINAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('FINAPI_CLIENT_SECRET');
    const baseUrl = Deno.env.get('FINAPI_BASE_URL') || 'https://sandbox.finapi.io';

    // Get access token from FinAPI
    const authResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Get accounts from FinAPI
    const accountsResponse = await fetch(`${baseUrl}/api/v1/accounts`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const accountsData = await accountsResponse.json();
    let importedCount = 0;
    let errors = 0;

    // Get FinAPI securities for this account
    for (const account of accountsData.accounts || []) {
      try {
        const securitiesResponse = await fetch(`${baseUrl}/api/v1/securities?accountId=${account.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const securitiesData = await securitiesResponse.json();

        // Import each security as AssetPortfolio
        for (const security of securitiesData.securities || []) {
          try {
            // Check if already exists
            const existing = await base44.asServiceRole.entities.AssetPortfolio.filter({
              user_id: userId,
              api_symbol: security.isin || security.symbol
            });

            if (existing.length === 0) {
              // Create new asset
              await base44.asServiceRole.entities.AssetPortfolio.create({
                user_id: userId,
                asset_category: 'STOCKS',
                name: security.name,
                isin: security.isin,
                currency: security.currency || 'EUR',
                purchase_date: new Date().toISOString().split('T')[0],
                purchase_price: security.lastPrice || 0,
                quantity: security.quantity || 1,
                current_value: security.lastPrice || 0,
                api_symbol: security.isin || security.symbol,
                import_source: 'finapi',
                auto_update_enabled: true,
                price_source: 'finapi'
              });
              importedCount++;
            }
          } catch (secError) {
            console.error(`Error importing security ${security.isin}:`, secError);
            errors++;
          }
        }
      } catch (accountError) {
        console.error(`Error syncing account ${account.id}:`, accountError);
        errors++;
      }
    }

    // Update sync record
    await base44.asServiceRole.entities.FinAPISync.update(sync.id, {
      last_sync: new Date().toISOString(),
      sync_count: (sync.sync_count || 0) + 1,
      imported_assets_count: importedCount,
      error_count: errors
    });

    console.log(`FinAPI sync completed: ${importedCount} imported, ${errors} errors`);

    return Response.json({
      success: true,
      imported_count: importedCount,
      errors,
      message: `FinAPI Sync: ${importedCount} Positionen importiert`
    });
  } catch (error) {
    console.error('FinAPI sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});