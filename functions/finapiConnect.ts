import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL") || "https://sandbox.finapi.io";
const CLIENT_ID = Deno.env.get("FINAPI_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("FINAPI_CLIENT_SECRET");

// Get FinAPI access token
async function getFinAPIToken() {
    const tokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials'
        })
    });

    if (!tokenResponse.ok) {
        throw new Error(`FinAPI auth failed: ${await tokenResponse.text()}`);
    }

    const data = await tokenResponse.json();
    return data.access_token;
}

// Create or get FinAPI user
async function getOrCreateFinAPIUser(base44UserId, accessToken) {
    // Try to get existing user
    const usersResponse = await fetch(`${FINAPI_BASE_URL}/api/v1/users`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (usersResponse.ok) {
        const users = await usersResponse.json();
        const existingUser = users.users?.find(u => u.email === base44UserId);
        if (existingUser) {
            return existingUser.id;
        }
    }

    // Create new user
    const createResponse = await fetch(`${FINAPI_BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: base44UserId,
            password: crypto.randomUUID(),
            email: base44UserId,
            isAutoUpdateEnabled: true
        })
    });

    if (!createResponse.ok) {
        throw new Error(`Failed to create FinAPI user: ${await createResponse.text()}`);
    }

    const newUser = await createResponse.json();
    return newUser.id;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bankId, redirectUrl } = await req.json();

        // Get FinAPI access token
        const accessToken = await getFinAPIToken();

        // Get or create FinAPI user
        const finapiUserId = await getOrCreateFinAPIUser(user.id, accessToken);

        // Import bank connection (Web Form)
        const importResponse = await fetch(`${FINAPI_BASE_URL}/api/v1/bankConnections/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bankId: bankId || null,
                interface: 'WEB_SCRAPER',
                redirectUrl: redirectUrl || `${req.headers.get('origin')}/bank-accounts`
            })
        });

        if (!importResponse.ok) {
            const error = await importResponse.text();
            return Response.json({ 
                error: 'Failed to initiate bank connection',
                details: error 
            }, { status: 400 });
        }

        const importData = await importResponse.json();

        // Store connection reference in Base44
        if (importData.id) {
            await base44.asServiceRole.entities.BankAccount.create({
                name: importData.bank?.name || 'Neue Bankverbindung',
                bank_name: importData.bank?.name || '',
                iban: '',
                finapi_connection_id: importData.id,
                finapi_user_id: finapiUserId,
                current_balance: 0,
                is_primary: false
            });
        }

        return Response.json({
            success: true,
            webFormUrl: importData.location,
            connectionId: importData.id
        });

    } catch (error) {
        console.error('FinAPI connect error:', error);
        return Response.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
});