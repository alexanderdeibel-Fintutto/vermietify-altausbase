import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
    status: 'active' 
  });

  const now = new Date();
  const notificationsSent = [];

  for (const contract of contracts) {
    if (contract.end_date && !contract.is_unlimited) {
      const endDate = new Date(contract.end_date);
      const daysUntilExpiry = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));

      // Notify 90, 60, and 30 days before expiry
      if ([90, 60, 30].includes(daysUntilExpiry)) {
        const tenant = await base44.asServiceRole.entities.Tenant.filter({ 
          id: contract.tenant_id 
        }).then(t => t[0]);

        if (tenant?.email) {
          await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
            user_email: tenant.email,
            title: 'Mietvertrag läuft bald ab',
            message: `Ihr Mietvertrag läuft in ${daysUntilExpiry} Tagen ab. Bitte kontaktieren Sie die Verwaltung für eine Verlängerung.`,
            type: 'contract',
            priority: daysUntilExpiry <= 30 ? 'high' : 'normal',
            related_entity_type: 'contract',
            related_entity_id: contract.id
          });

          notificationsSent.push({
            contract_id: contract.id,
            tenant_email: tenant.email,
            days_until_expiry: daysUntilExpiry
          });
        }

        // Notify admins
        const users = await base44.asServiceRole.entities.User.list();
        const admins = users.filter(u => u.role === 'admin');

        for (const admin of admins) {
          await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
            user_email: admin.email,
            title: 'Vertrag läuft bald ab',
            message: `Mietvertrag von ${tenant?.first_name} ${tenant?.last_name} läuft in ${daysUntilExpiry} Tagen ab.`,
            type: 'contract',
            priority: 'normal',
            related_entity_type: 'contract',
            related_entity_id: contract.id
          });
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