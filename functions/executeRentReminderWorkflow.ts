import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { workflow_id, days_before_due = 3 } = await req.json();

  // Get all active contracts
  const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
    status: 'active' 
  });

  const today = new Date();
  const results = [];

  for (const contract of contracts) {
    // Calculate next due date based on rent_due_day
    const nextDueDate = new Date(today.getFullYear(), today.getMonth(), contract.rent_due_day || 1);
    if (nextDueDate < today) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    const daysUntilDue = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue === days_before_due) {
      // Get tenant info
      const tenant = await base44.asServiceRole.entities.Tenant.filter({ 
        id: contract.tenant_id 
      }).then(t => t[0]);

      if (tenant) {
        // Send reminder
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: tenant.email,
          subject: 'Zahlungserinnerung - Miete fällig',
          body: `
Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

dies ist eine freundliche Erinnerung, dass Ihre Mietzahlung in ${daysUntilDue} Tagen fällig ist.

Betrag: ${contract.total_rent}€
Fällig am: ${nextDueDate.toLocaleDateString('de-DE')}

Mit freundlichen Grüßen,
Ihre Hausverwaltung
          `
        });

        // Create notification
        await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
          user_email: tenant.email,
          title: 'Mietzahlung fällig',
          message: `Ihre Miete über ${contract.total_rent}€ ist am ${nextDueDate.toLocaleDateString('de-DE')} fällig.`,
          type: 'payment',
          priority: 'normal',
          related_entity_type: 'contract',
          related_entity_id: contract.id
        });

        results.push({ tenant: tenant.email, amount: contract.total_rent, due_date: nextDueDate });
      }
    }
  }

  return Response.json({ 
    success: true, 
    reminders_sent: results.length,
    details: results
  });
});