import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const payments = await base44.asServiceRole.entities.Payment.list();
  const now = new Date();
  const notificationsSent = [];

  for (const payment of payments) {
    if (payment.status === 'pending' || payment.status === 'overdue') {
      const dueDate = new Date(payment.due_date);
      const daysDiff = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

      // Notify if payment is overdue
      if (daysDiff > 0 && payment.tenant_id) {
        const tenant = await base44.asServiceRole.entities.Tenant.filter({ 
          id: payment.tenant_id 
        }).then(t => t[0]);

        if (tenant?.email) {
          await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
            user_email: tenant.email,
            title: 'Überfällige Zahlung',
            message: `Ihre Zahlung über ${payment.amount}€ ist seit ${daysDiff} Tag(en) überfällig.`,
            type: 'payment',
            priority: daysDiff > 7 ? 'high' : 'normal',
            related_entity_type: 'payment',
            related_entity_id: payment.id
          });

          notificationsSent.push({
            payment_id: payment.id,
            tenant_email: tenant.email,
            days_overdue: daysDiff
          });

          // Update payment status
          if (payment.status !== 'overdue') {
            await base44.asServiceRole.entities.Payment.update(payment.id, {
              status: 'overdue'
            });
          }
        }
      }
    }
  }

  return Response.json({ 
    success: true, 
    notifications_sent: notificationsSent.length,
    details: notificationsSent
  });
});