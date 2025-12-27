import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL")?.replace(/\/$/, '');
const CLIENT_ID = Deno.env.get("FINAPI_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("FINAPI_CLIENT_SECRET");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                error: 'Bitte melden Sie sich an.' 
            }, { status: 401 });
        }

        if (!user.finapi_user_id) {
            return Response.json({ 
                error: 'Keine Bankverbindung gefunden.'
            }, { status: 400 });
        }

        // Get client credentials token
        const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
        const tokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials'
            })
        });

        if (!tokenResponse.ok) {
            return Response.json({ 
                error: 'Bankverbindung konnte nicht hergestellt werden.'
            }, { status: 500 });
        }

        const { access_token } = await tokenResponse.json();

        // Get bank connections for this user
        const connectionsResponse = await fetch(
            `${FINAPI_BASE_URL}/api/v1/bankConnections`,
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'X-HTTP-Method-Override': 'GET',
                    'X-Request-User-Id': user.finapi_user_id,
                    'Accept': 'application/json'
                }
            }
        );

        if (!connectionsResponse.ok) {
            const error = await connectionsResponse.text();
            console.error('Connections error:', error);
            return Response.json({ 
                error: 'Konten konnten nicht abgerufen werden.'
            }, { status: 500 });
        }

        const connectionsData = await connectionsResponse.json();
        const connections = connectionsData.connections || [];

        let importedCount = 0;

        // Import each bank connection's accounts
        for (const connection of connections) {
            // Get accounts for this connection
            const accountsResponse = await fetch(
                `${FINAPI_BASE_URL}/api/v1/accounts?bankConnectionIds=${connection.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'X-Request-User-Id': user.finapi_user_id,
                        'Accept': 'application/json'
                    }
                }
            );

            if (!accountsResponse.ok) {
                console.error('Failed to fetch accounts for connection:', connection.id);
                continue;
            }

            const accountsData = await accountsResponse.json();
            const accounts = accountsData.accounts || [];

            for (const account of accounts) {
                // Check if account already exists
                const existing = await base44.entities.BankAccount.filter({
                    iban: account.iban,
                    created_by: user.email
                });

                if (existing.length === 0) {
                    // Create new bank account
                    await base44.entities.BankAccount.create({
                        name: account.accountName || `${connection.bankName} - ${account.accountNumber}`,
                        bank_name: connection.bankName,
                        iban: account.iban,
                        bic: account.bic || '',
                        current_balance: account.balance || 0,
                        finapi_connection_id: connection.id.toString(),
                        finapi_user_id: user.finapi_user_id,
                        last_sync: new Date().toISOString(),
                        is_primary: false
                    });
                    importedCount++;
                } else {
                    // Update existing account
                    await base44.entities.BankAccount.update(existing[0].id, {
                        current_balance: account.balance || 0,
                        finapi_connection_id: connection.id.toString(),
                        finapi_user_id: user.finapi_user_id,
                        last_sync: new Date().toISOString()
                    });
                }
            }
        }

        return Response.json({
            success: true,
            imported: importedCount,
            message: importedCount > 0 
                ? `${importedCount} Konto${importedCount > 1 ? 'en' : ''} erfolgreich verbunden`
                : 'Keine neuen Konten gefunden'
        });

    } catch (error) {
        console.error('Import error:', error);
        return Response.json({ 
            error: 'Konten konnten nicht importiert werden.'
        }, { status: 500 });
    }
});