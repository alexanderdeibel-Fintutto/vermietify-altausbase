import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await base44.entities.FinancialItem.list('-date', 30);
  
  const income = items.filter(i => i.amount > 0).reduce((sum, i) => sum + i.amount, 0);
  const expenses = Math.abs(items.filter(i => i.amount < 0).reduce((sum, i) => sum + i.amount, 0));
  
  const timeline = [];
  for (let i = 0; i < 7; i++) {
    timeline.push({
      date: `${i+4}.1.`,
      balance: 50000 + (Math.random() - 0.5) * 10000
    });
  }

  return Response.json({
    income: Math.round(income),
    expenses: Math.round(expenses),
    balance: Math.round(income - expenses),
    timeline
  });
});