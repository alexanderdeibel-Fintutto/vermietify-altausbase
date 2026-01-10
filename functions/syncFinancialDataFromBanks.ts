import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sync_all_accounts = true } = await req.json();

  const accounts = await base44.entities.BankAccount.list(null, 100);
  let transactionsSynced = 0;

  for (const account of accounts) {
    if (!account.is_active) continue;

    // Simulate FinAPI sync
    const mockTransactions = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Transaction ${i + 1}`,
      amount: (Math.random() * 500 - 250).toFixed(2),
      type: Math.random() > 0.5 ? 'income' : 'expense'
    }));

    for (const tx of mockTransactions) {
      await base44.entities.BankTransaction.create({
        account_id: account.id,
        date: tx.date,
        description: tx.description,
        amount: parseFloat(tx.amount),
        transaction_type: parseFloat(tx.amount) > 0 ? 'income' : 'expense'
      });
      transactionsSynced++;
    }
  }

  await base44.entities.SyncJob.create({
    sync_type: 'bank_transactions',
    status: 'completed',
    records_synced: transactionsSynced,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  });

  return Response.json({
    success: true,
    transactions_synced: transactionsSynced,
    accounts_synced: accounts.length
  });
});