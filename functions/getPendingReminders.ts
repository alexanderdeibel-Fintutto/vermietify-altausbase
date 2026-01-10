import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const overduePayments = await base44.entities.Payment.filter({
    status: 'pending',
    due_date: { $lt: new Date().toISOString() }
  }, null, 50);

  const reminders = [];
  for (const payment of overduePayments) {
    const tenant = (await base44.entities.Tenant.filter({ id: payment.tenant_id }))[0];
    const overdueDays = Math.floor((Date.now() - new Date(payment.due_date)) / (1000 * 60 * 60 * 24));
    
    reminders.push({
      id: payment.id,
      tenant_name: tenant?.name || 'Unbekannt',
      amount: payment.amount,
      overdue_days: overdueDays,
      reminder_level: overdueDays > 30 ? 3 : overdueDays > 14 ? 2 : 1
    });
  }

  return Response.json({ reminders });
});