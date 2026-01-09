import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sync financial data from banks via FinAPI (PSD2/Open Banking)
 * Secure authentication with token management and data cleanup
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, finapi_user_id, sync_type } = await req.json();

        const FINAPI_CLIENT_ID = Deno.env.get('FINAPI_CLIENT_ID');
        const FINAPI_CLIENT_SECRET = Deno.env.get('FINAPI_CLIENT_SECRET');
        const FINAPI_BASE_URL = Deno.env.get('FINAPI_BASE_URL');

        if (!FINAPI_CLIENT_ID || !FINAPI_CLIENT_SECRET || !FINAPI_BASE_URL) {
            return Response.json({
                error: 'FinAPI credentials not configured',
                setup_required: true
            }, { status: 400 });
        }

        // Get or create FinAPI user for this app user
        let userFinapiId = finapi_user_id;

        if (!userFinapiId) {
            // Create new FinAPI user
            const createUserResponse = await fetch(`${FINAPI_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${FINAPI_CLIENT_ID}:${FINAPI_CLIENT_SECRET}`)}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: user.email,
                    phone: '',
                    isAutoLoginEnabled: false
                })
            });

            if (!createUserResponse.ok) {
                throw new Error(`Failed to create FinAPI user: ${createUserResponse.statusText}`);
            }

            const userData = await createUserResponse.json();
            userFinapiId = userData.userId;

            // Save FinAPI user ID to user profile
            await base44.auth.updateMe({
                finapi_user_id: userFinapiId,
                finapi_connected: true,
                finapi_connected_at: new Date().toISOString()
            });
        }

        // Get client token for this FinAPI user
        const clientTokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${FINAPI_CLIENT_ID}:${FINAPI_CLIENT_SECRET}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: FINAPI_CLIENT_ID,
                client_secret: FINAPI_CLIENT_SECRET
            }).toString()
        });

        if (!clientTokenResponse.ok) {
            throw new Error('Failed to get FinAPI client token');
        }

        const tokenData = await clientTokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch accounts
        const accountsResponse = await fetch(`${FINAPI_BASE_URL}/accounts?userId=${userFinapiId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!accountsResponse.ok) {
            throw new Error('Failed to fetch accounts from FinAPI');
        }

        const accountsData = await accountsResponse.json();
        const accounts = accountsData.accounts || [];

        // Fetch transactions for each account
        const allTransactions = [];
        for (const account of accounts) {
            const txResponse = await fetch(
                `${FINAPI_BASE_URL}/transactions?accountId=${account.id}&minDate=${getMinDate()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (txResponse.ok) {
                const txData = await txResponse.json();
                allTransactions.push(...(txData.transactions || []));
            }
        }

        return Response.json({
            success: true,
            accounts_synced: accounts.length,
            transactions_synced: allTransactions.length,
            accounts,
            transactions: allTransactions,
            sync_timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error syncing bank data:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function getMinDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 3); // Last 3 months
    return date.toISOString().split('T')[0];
}