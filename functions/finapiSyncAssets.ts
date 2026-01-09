import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const finApiBaseUrl = Deno.env.get('FINAPI_BASE_URL');
    const clientId = Deno.env.get('FINAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('FINAPI_CLIENT_SECRET');

    if (!finApiBaseUrl || !clientId || !clientSecret) {
      return Response.json({ error: 'FinAPI not configured' }, { status: 400 });
    }

    const tokenResponse = await fetch(`${finApiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const { access_token } = await tokenResponse.json();

    const accountsResponse = await fetch(`${finApiBaseUrl}/api/accounts`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const accounts = await accountsResponse.json();

    const syncedAccounts = [];
    for (const account of (accounts.accounts || [])) {
      const finItemRecord = await base44.entities.FinAPISync.create({
        user_email: user.email,
        finapi_account_id: account.id,
        account_name: account.accountName,
        currency: account.accountCurrency,
        balance: account.balance,
        last_synced: new Date().toISOString()
      });
      syncedAccounts.push(finItemRecord);
    }

    return Response.json({
      success: true,
      synced_accounts: syncedAccounts.length,
      accounts: syncedAccounts,
      message: 'Accounts synced successfully from FinAPI'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});