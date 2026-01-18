import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [invoices, payments, contracts] = await Promise.all([
      base44.asServiceRole.entities.Invoice.filter({
        created_date: { $gte: lastMonth.toISOString(), $lt: thisMonth.toISOString() }
      }),
      base44.asServiceRole.entities.ActualPayment.filter({
        created_date: { $gte: lastMonth.toISOString(), $lt: thisMonth.toISOString() }
      }),
      base44.asServiceRole.entities.LeaseContract.filter({
        created_date: { $gte: lastMonth.toISOString(), $lt: thisMonth.toISOString() }
      })
    ]);

    const totalIncome = payments.reduce((sum, p) => sum + (p.betrag || 0), 0);
    const totalExpenses = invoices.filter(i => i.kategorie === 'expense').reduce((sum, i) => sum + (i.betrag || 0), 0);

    const report = {
      period: lastMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
      new_contracts: contracts.length,
      total_invoices: invoices.length,
      total_payments: payments.length,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_result: totalIncome - totalExpenses,
      generated_at: new Date().toISOString()
    };

    return Response.json(report);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});