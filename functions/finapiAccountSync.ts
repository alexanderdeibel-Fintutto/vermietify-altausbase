import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get('FINAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('FINAPI_CLIENT_SECRET');
    const baseUrl = Deno.env.get('FINAPI_BASE_URL') || 'https://sandbox.finapi.io';

    // 1. Get finAPI access token
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Get user's finAPI accounts
    const accountsResponse = await fetch(`${baseUrl}/api/v1/accounts`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const accountsData = await accountsResponse.json();

    const accounts = [];
    for (const account of accountsData.accounts || []) {
      accounts.push({
        account_id: account.id,
        name: account.accountName,
        type: account.accountType,
        balance: account.balance,
        currency: account.currency || 'EUR',
        updated_at: new Date().toISOString()
      });
    }

    // 3. Get securities (investments) if user has trading accounts
    const securitiesResponse = await fetch(`${baseUrl}/api/v1/securities`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const securitiesData = await securitiesResponse.json();
    const securities = [];

    for (const security of securitiesData.securities || []) {
      const existingAsset = await base44.entities.AssetPortfolio.filter({
        user_id: user.id,
        isin: security.isin
      });

      if (!existingAsset || existingAsset.length === 0) {
        securities.push({
          isin: security.isin,
          name: security.name,
          currency: security.currency || 'EUR',
          quantity: security.quantity,
          price: security.price,
          from_finapi: true
        });
      }
    }

    return Response.json({
      success: true,
      accounts,
      securities,
      message: `Found ${accounts.length} accounts and ${securities.length} new securities`
    });
  } catch (error) {
    console.error('finapiAccountSync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});