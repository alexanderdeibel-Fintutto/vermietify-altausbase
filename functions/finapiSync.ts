import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL") || "https://sandbox.finapi.io";
const CLIENT_ID = Deno.env.get("FINAPI_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("FINAPI_CLIENT_SECRET");

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

async function syncBankAccount(base44, accessToken, bankAccount) {
    if (!bankAccount.finapi_connection_id) {
        return { skipped: true, reason: 'No FinAPI connection' };
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
        throw new Error(`Failed to fetch accounts: ${await accountsResponse.text()}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
        return { skipped: true, reason: 'No accounts found' };
    }

    let totalNewTransactions = 0;

    for (const account of accounts) {
        // Update account balance
        await base44.asServiceRole.entities.BankAccount.update(bankAccount.id, {
            current_balance: account.balance || 0,
            iban: account.iban || bankAccount.iban
        });

        // Get transactions for this account
        const transactionsResponse = await fetch(
            `${FINAPI_BASE_URL}/api/v1/transactions?accountIds=${account.id}&perPage=100`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!transactionsResponse.ok) {
            continue;
        }

        const transactionsData = await transactionsResponse.json();
        const transactions = transactionsData.transactions || [];

        // Import transactions
        for (const tx of transactions) {
            // Check if transaction already exists
            const existing = await base44.asServiceRole.entities.BankTransaction.filter({
                account_id: bankAccount.id,
                reference: tx.purpose || '',
                amount: tx.amount,
                transaction_date: tx.valueDate || tx.bankBookingDate
            });

            if (existing.length === 0) {
                await base44.asServiceRole.entities.BankTransaction.create({
                    account_id: bankAccount.id,
                    transaction_date: tx.bankBookingDate,
                    value_date: tx.valueDate,
                    amount: tx.amount,
                    description: tx.purpose || '',
                    sender_receiver: tx.counterpartName || '',
                    iban: tx.counterpartIban || '',
                    reference: tx.purpose || '',
                    is_matched: false,
                    matched_payment_id: null
                });
                totalNewTransactions++;
            }
        }
    }

    return { 
        success: true, 
        newTransactions: totalNewTransactions,
        accountsProcessed: accounts.length
    };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { accountId } = await req.json().catch(() => ({}));

        // Get FinAPI access token
        const accessToken = await getFinAPIToken();

        // Get bank accounts to sync
        let bankAccounts;
        if (accountId) {
            const account = await base44.entities.BankAccount.filter({ id: accountId });
            bankAccounts = account;
        } else {
            bankAccounts = await base44.entities.BankAccount.list();
        }

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
                results.push({
                    accountId: account.id,
                    accountName: account.name,
                    error: error.message
                });
            }
        }

        // Trigger auto-matching after sync
        if (totalNewTransactions > 0) {
            try {
                await base44.functions.invoke('autoMatchTransactions', {});
            } catch (error) {
                console.error('Auto-match failed:', error);
            }
        }

        return Response.json({
            success: true,
            totalNewTransactions,
            results
        });

    } catch (error) {
        console.error('FinAPI sync error:', error);
        return Response.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
});