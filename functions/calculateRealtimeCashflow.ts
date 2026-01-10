import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await base44.entities.BankAccount.list(null, 20);
  const balance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentItems = await base44.entities.FinancialItem.filter({
    created_date: { $gte: last30Days }
  }, null, 500);

  const income_30d = recentItems.filter(i => i.amount > 0).reduce((sum, i) => sum + i.amount, 0);
  const expenses_30d = Math.abs(recentItems.filter(i => i.amount < 0).reduce((sum, i) => sum + i.amount, 0));

  return Response.json({ balance, income_30d, expenses_30d });
});