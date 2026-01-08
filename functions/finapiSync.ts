import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const FINAPI_CLIENT_ID = Deno.env.get('FINAPI_CLIENT_ID');
    const FINAPI_CLIENT_SECRET = Deno.env.get('FINAPI_CLIENT_SECRET');
    const FINAPI_BASE_URL = Deno.env.get('FINAPI_BASE_URL') || 'https://sandbox.finapi.io';

    console.log('[FINAPI] Syncing transactions...');

    // 1. Get client token
    const tokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${FINAPI_CLIENT_ID}:${FINAPI_CLIENT_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get FINAPI token');
    }

    const { access_token } = await tokenResponse.json();

    // 2. Get accounts
    const accountsResponse = await fetch(`${FINAPI_BASE_URL}/api/accounts`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!accountsResponse.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const { accounts } = await accountsResponse.json();
    
    let totalTransactions = 0;
    let newTransactions = 0;

    // 3. For each account, sync transactions
    for (const account of accounts) {
      const txResponse = await fetch(
        `${FINAPI_BASE_URL}/api/transactions?accountIds=${account.id}&minBankConnectionId=0`,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );

      if (!txResponse.ok) continue;

      const { transactions: finapiTxs } = await txResponse.json();

      // 4. Store in database
      for (const fTx of finapiTxs) {
        const existing = await base44.entities.BankTransaction.filter({
          finapi_transaction_id: fTx.id
        });

        if (existing.length === 0) {
          await base44.entities.BankTransaction.create({
            account_id: account.id,
            finapi_transaction_id: fTx.id,
            transaction_date: fTx.transactionDate || fTx.bookingDate,
            amount: fTx.amount,
            sender_receiver: fTx.counterpartName || fTx.purpose,
            description: fTx.purpose || 'Transaction',
            reference: fTx.reference || '',
            iban: fTx.counterpartIban || '',
            is_categorized: false,
            category: null
          });
          newTransactions++;
        }
        totalTransactions++;
      }
    }

    console.log(`[FINAPI] Synced ${totalTransactions} transactions, ${newTransactions} new`);

    return Response.json({
      success: true,
      total_transactions: totalTransactions,
      new_transactions: newTransactions
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});