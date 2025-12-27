import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL")?.replace(/\/$/, '');
const CLIENT_ID = Deno.env.get("FINAPI_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("FINAPI_CLIENT_SECRET");

async function getFinAPIToken() {
    if (!FINAPI_BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('FinAPI Credentials nicht vollständig konfiguriert');
    }

    if (!FINAPI_BASE_URL.startsWith('http://') && !FINAPI_BASE_URL.startsWith('https://')) {
        throw new Error(`FINAPI_BASE_URL muss mit http:// oder https:// beginnen. Aktuell: "${FINAPI_BASE_URL}"`);
    }

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
        const errorText = await tokenResponse.text();
        console.error('FinAPI Token Error:', {
            status: tokenResponse.status,
            body: errorText
        });
        throw new Error(`FinAPI Authentifizierung fehlgeschlagen: ${tokenResponse.status}`);
    }

    const data = await tokenResponse.json();
    return data.access_token;
}

async function syncBankAccount(base44, accessToken, bankAccount) {
    console.log('Syncing account:', bankAccount.name);

    if (!bankAccount.finapi_connection_id) {
        console.log('Skipping - no FinAPI connection');
        return { skipped: true, reason: 'Keine FinAPI-Verbindung' };
    }

    // Get accounts for this connection
    const accountsResponse = await fetch(
        `${FINAPI_BASE_URL}/api/v1/accounts?bankConnectionIds=${bankAccount.finapi_connection_id}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!accountsResponse.ok) {
        const error = await accountsResponse.text();
        throw new Error(`Konten konnten nicht abgerufen werden: ${error}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];

    console.log(`Found ${accounts.length} accounts`);

    if (accounts.length === 0) {
        return { skipped: true, reason: 'Keine Konten gefunden' };
    }

    let totalNewTransactions = 0;
    let accountsUpdated = 0;

    for (const account of accounts) {
        // Update account balance and IBAN
        await base44.asServiceRole.entities.BankAccount.update(bankAccount.id, {
            current_balance: account.balance || 0,
            iban: account.iban || bankAccount.iban,
            last_sync: new Date().toISOString()
        });
        accountsUpdated++;

        // Get transactions
        const transactionsResponse = await fetch(
            `${FINAPI_BASE_URL}/api/v1/transactions?accountIds=${account.id}&perPage=500&order=desc`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!transactionsResponse.ok) {
            console.error('Failed to fetch transactions for account:', account.id);
            continue;
        }

        const transactionsData = await transactionsResponse.json();
        const transactions = transactionsData.transactions || [];

        console.log(`Found ${transactions.length} transactions for account ${account.id}`);

        // Import transactions
        for (const tx of transactions) {
            // Check if exists (by unique combination)
            const existing = await base44.asServiceRole.entities.BankTransaction.filter({
                account_id: bankAccount.id,
                transaction_date: tx.bankBookingDate,
                amount: tx.amount,
                description: tx.purpose || ''
            });

            if (existing.length === 0) {
                try {
                    await base44.asServiceRole.entities.BankTransaction.create({
                        account_id: bankAccount.id,
                        transaction_date: tx.bankBookingDate,
                        value_date: tx.valueDate || tx.bankBookingDate,
                        amount: tx.amount,
                        description: tx.purpose || '',
                        sender_receiver: tx.counterpartName || '',
                        iban: tx.counterpartIban || '',
                        reference: tx.purpose || '',
                        is_matched: false,
                        matched_payment_id: null
                    });
                    totalNewTransactions++;
                } catch (err) {
                    console.error('Failed to create transaction:', err);
                }
            }
        }
    }

    console.log(`Sync complete: ${totalNewTransactions} new transactions`);

    return { 
        success: true, 
        newTransactions: totalNewTransactions,
        accountsUpdated
    };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Nicht autorisiert' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { accountId } = body;

        console.log('Starting sync for user:', user.id, 'accountId:', accountId);

        // Get FinAPI access token
        const accessToken = await getFinAPIToken();

        // Get bank accounts to sync
        let bankAccounts;
        if (accountId) {
            bankAccounts = await base44.entities.BankAccount.filter({ id: accountId });
        } else {
            bankAccounts = await base44.entities.BankAccount.list();
        }

        console.log(`Syncing ${bankAccounts.length} accounts`);

        const results = [];
        let totalNewTransactions = 0;

        for (const account of bankAccounts) {
            try {
                const result = await syncBankAccount(base44, accessToken, account);
                results.push({
                    accountId: account.id,
                    accountName: account.name,
                    ...result
                });
                if (result.newTransactions) {
                    totalNewTransactions += result.newTransactions;
                }
            } catch (error) {
                console.error(`Error syncing account ${account.id}:`, error);
                results.push({
                    accountId: account.id,
                    accountName: account.name,
                    error: error.message
                });
            }
        }

        // Auto-match transactions if any were imported
        if (totalNewTransactions > 0) {
            console.log('Triggering auto-match...');
            try {
                await base44.functions.invoke('autoMatchTransactions', {});
            } catch (error) {
                console.error('Auto-match failed:', error);
            }
        }

        return Response.json({
            success: true,
            totalNewTransactions,
            accountsSynced: results.filter(r => r.success).length,
            results
        });

    } catch (error) {
        console.error('FinAPI sync error:', error);
        return Response.json({ 
            error: error.message || 'Synchronisation fehlgeschlagen',
            details: error.stack
        }, { status: 500 });
    }
});