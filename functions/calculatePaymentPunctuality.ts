import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payments = await base44.entities.Payment.list();
  const tenants = await base44.entities.Tenant.list();

  let onTime = 0;
  let late = 0;
  let outstanding = 0;
  let totalDelay = 0;
  let lateCount = 0;
  let outstandingAmount = 0;

  const tenantLatePayments = {};

  for (const payment of payments) {
    if (payment.status === 'paid' && payment.paid_date && payment.due_date) {
      const dueDate = new Date(payment.due_date);
      const paidDate = new Date(payment.paid_date);
      const diffDays = Math.round((paidDate - dueDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        onTime++;
      } else {
        late++;
        totalDelay += diffDays;
        lateCount++;
        
        const tenantId = payment.tenant_id;
        tenantLatePayments[tenantId] = (tenantLatePayments[tenantId] || 0) + 1;
      }
    } else if (payment.status === 'pending' || payment.status === 'overdue') {
      outstanding++;
      outstandingAmount += payment.amount || 0;
    }
  }

  const total = onTime + late;
  const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0;
  const avgDelay = lateCount > 0 ? Math.round(totalDelay / lateCount) : 0;

  const problematicTenants = Object.entries(tenantLatePayments)
    .map(([tenantId, count]) => {
      const tenant = tenants.find(t => t.id === tenantId);
      return {
        name: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt',
        late_payments: count
      };
    })
    .sort((a, b) => b.late_payments - a.late_payments)
    .slice(0, 5);

  return Response.json({
    on_time_rate: onTimeRate,
    on_time: onTime,
    late,
    outstanding,
    average_delay_days: avgDelay,
    outstanding_amount: Math.round(outstandingAmount),
    problematic_tenants: problematicTenants
  });
});