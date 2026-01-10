import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const financialItems = await base44.entities.FinancialItem.list(null, 500);
  const buildings = await base44.entities.Building.list(null, 50);

  const totalIncome = financialItems
    .filter(f => f.amount > 0)
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpenses = financialItems
    .filter(f => f.amount < 0)
    .reduce((sum, f) => sum + Math.abs(f.amount), 0);

  await base44.entities.TaxFiling.create({
    year: new Date().getFullYear(),
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_income: totalIncome - totalExpenses,
    status: 'draft'
  });

  return Response.json({ success: true });
});