import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fields } = await req.json();

  const reportData = {};

  if (fields.income) {
    const items = await base44.entities.FinancialItem.filter({ amount: { $gt: 0 } }, null, 100);
    reportData.income = items.reduce((sum, i) => sum + i.amount, 0);
  }

  if (fields.expenses) {
    const items = await base44.entities.FinancialItem.filter({ amount: { $lt: 0 } }, null, 100);
    reportData.expenses = Math.abs(items.reduce((sum, i) => sum + i.amount, 0));
  }

  return Response.json({ report: reportData });
});