import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { finapi_user_id } = await req.json();
    const FINAPI_BASE_URL = Deno.env.get('FINAPI_BASE_URL');
    const FINAPI_CLIENT_ID = Deno.env.get('FINAPI_CLIENT_ID');
    const FINAPI_CLIENT_SECRET = Deno.env.get('FINAPI_CLIENT_SECRET');

    // Get Access Token
    const tokenRes = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${FINAPI_CLIENT_ID}&client_secret=${FINAPI_CLIENT_SECRET}&grant_type=client_credentials`
    });
    const { access_token } = await tokenRes.json();

    // Fetch all accounts for user
    const accountsRes = await fetch(`${FINAPI_BASE_URL}/api/v1/accounts?userId=${finapi_user_id}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const accountsData = await accountsRes.json();

    let totalAssets = 0;
    const assets = [];

    // Process each account
    for (const account of accountsData.accounts || []) {
      totalAssets += account.balance?.balance || 0;

      // Fetch securities (stocks, ETFs) per account
      const securitiesRes = await fetch(
        `${FINAPI_BASE_URL}/api/v1/securities?accountId=${account.id}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const securitiesData = await securitiesRes.json();

      for (const sec of securitiesData.securities || []) {
        const value = (sec.quantity || 0) * (sec.marketValue || 0);
        totalAssets += value;

        assets.push({
          type: 'security',
          isin: sec.isin,
          name: sec.name,
          quantity: sec.quantity,
          market_value: sec.marketValue,
          total_value: value,
          account_id: account.id,
          currency: account.currency
        });
      }
    }

    // Save to database as FinAPISync record
    const sync = await base44.entities.FinAPISync.create({
      user_email: user.email,
      finapi_user_id,
      total_assets: totalAssets,
      accounts_count: (accountsData.accounts || []).length,
      securities_count: assets.length,
      last_sync: new Date().toISOString(),
      sync_status: 'completed'
    });

    // Store individual assets
    for (const asset of assets) {
      await base44.entities.AssetPortfolio.create({
        user_email: user.email,
        asset_type: asset.type,
        isin: asset.isin,
        name: asset.name,
        quantity: asset.quantity,
        market_value: asset.market_value,
        total_value: asset.total_value,
        source: 'finapi_sync',
        last_updated: new Date().toISOString()
      });
    }

    return Response.json({
      user_email: user.email,
      sync_id: sync.id,
      total_assets: totalAssets,
      assets_imported: assets.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});