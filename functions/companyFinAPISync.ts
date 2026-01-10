import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id } = await req.json();
    const company = await base44.entities.Company.filter({ id: company_id });

    if (company.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get FinAPI credentials
    const clientId = Deno.env.get('FINAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('FINAPI_CLIENT_SECRET');
    const baseUrl = Deno.env.get('FINAPI_BASE_URL');

    if (!clientId || !clientSecret || !baseUrl) {
      return Response.json({ error: 'FinAPI not configured' }, { status: 500 });
    }

    // Authenticate with FinAPI
    const authResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    const { access_token } = await authResponse.json();

    // Fetch accounts
    const accountsResponse = await fetch(`${baseUrl}/api/accounts`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const { accounts } = await accountsResponse.json();

    // Map FinAPI accounts to company bank accounts
    const bankAccounts = accounts.map(account => ({
      id: account.id.toString(),
      bank_name: account.bankName || 'N/A',
      account_holder: account.accountHolderName || 'N/A',
      iban: account.iban,
      bic: account.bic
    }));

    // Update company
    await base44.entities.Company.update(company_id, {
      bank_accounts: bankAccounts,
      finapi_sync_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      synced_accounts: bankAccounts.length,
      accounts: bankAccounts
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});