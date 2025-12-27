import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL")?.replace(/\/$/, '');
const CLIENT_ID = Deno.env.get("FINAPI_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("FINAPI_CLIENT_SECRET");

async function getAccessToken() {
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
        throw new Error('Authentifizierung fehlgeschlagen');
    }

    const { access_token } = await tokenResponse.json();
    return access_token;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                error: 'Bitte melden Sie sich an.' 
            }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { accountId } = body;

        const accessToken = await getAccessToken();

        // Get accounts to sync
        let accounts;
        if (accountId) {
            accounts = await base44.entities.BankAccount.filter({ 
                id: accountId,
                created_by: user.email
            });
        } else {
            accounts = await base44.entities.BankAccount.filter({
                created_by: user.email
            });
        }

        if (accounts.length === 0) {
            return Response.json({ 
                error: 'Keine Konten zum Synchronisieren gefunden.'
            }, { status: 404 });
        }

        let totalNewTransactions = 0;
        let syncedCount = 0;

        for (const account of accounts) {
            if (!account.finapi_connection_id || !account.finapi_user_id) {
                continue;
            }

            try {
                // Get FinAPI accounts for this connection
                const accountsResponse = await fetch(
                    `${FINAPI_BASE_URL}/api/v1/accounts?bankConnectionIds=${account.finapi_connection_id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'X-Request-User-Id': account.finapi_user_id,
                            'Accept': 'application/json'
                        }
                    }
                );

                if (!accountsResponse.ok) {
                    console.error('Failed to fetch accounts for:', account.name);
                    continue;
                }

                const accountsData = await accountsResponse.json();
                const finapiAccounts = accountsData.accounts || [];

                for (const finapiAccount of finapiAccounts) {
                    // Update balance
                    await base44.entities.BankAccount.update(account.id, {
                        current_balance: finapiAccount.balance || 0,
                        last_sync: new Date().toISOString()
                    });

                    // Get transactions
                    const transactionsResponse = await fetch(
                        `${FINAPI_BASE_URL}/api/v1/transactions?accountIds=${finapiAccount.id}&perPage=500&order=desc`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'X-Request-User-Id': account.finapi_user_id,
                                'Accept': 'application/json'
                            }
                        }
                    );

                    if (!transactionsResponse.ok) {
                        console.error('Failed to fetch transactions for:', account.name);
                        continue;
                    }

                    const transactionsData = await transactionsResponse.json();
                    const transactions = transactionsData.transactions || [];

                    // Import transactions
                    for (const tx of transactions) {
                        // Check if exists
                        const existing = await base44.entities.BankTransaction.filter({
                            account_id: account.id,
                            transaction_date: tx.bankBookingDate,
                            amount: tx.amount,
                            description: tx.purpose || ''
                        });

                        if (existing.length === 0) {
                            await base44.entities.BankTransaction.create({
                                account_id: account.id,
                                transaction_date: tx.bankBookingDate,
                                value_date: tx.valueDate || tx.bankBookingDate,
                                amount: tx.amount,
                                description: tx.purpose || '',
                                sender_receiver: tx.counterpartName || '',
                                iban: tx.counterpartIban || '',
                                reference: tx.purpose || '',
                                is_matched: false
                            });
                            totalNewTransactions++;
                        }
                    }
                }

                syncedCount++;
            } catch (error) {
                console.error(`Error syncing account ${account.name}:`, error);
            }
        }

        return Response.json({
            success: true,
            synced: syncedCount,
            newTransactions: totalNewTransactions,
            message: totalNewTransactions > 0 
                ? `${totalNewTransactions} neue Transaktion${totalNewTransactions > 1 ? 'en' : ''} importiert`
                : 'Keine neuen Transaktionen'
        });

    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({ 
            error: 'Synchronisierung fehlgeschlagen.'
        }, { status: 500 });
    }
});