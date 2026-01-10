import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { workflow_id, days_before_expiry = 60 } = await req.json();

  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + days_before_expiry);

  // Get contracts expiring around target date
  const allContracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
    status: 'active',
    is_unlimited: false
  });

  const expiringContracts = allContracts.filter(contract => {
    if (!contract.end_date) return false;
    const endDate = new Date(contract.end_date);
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= days_before_expiry - 5 && daysUntilExpiry <= days_before_expiry + 5;
  });

  const results = [];

  for (const contract of expiringContracts) {
    const tenant = await base44.asServiceRole.entities.Tenant.filter({ 
      id: contract.tenant_id 
    }).then(t => t[0]);

    const unit = await base44.asServiceRole.entities.Unit.filter({ 
      id: contract.unit_id 
    }).then(u => u[0]);

    if (tenant && unit) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: tenant.email,
        subject: 'Vertragsverlängerung - Ihr Mietvertrag läuft bald aus',
        body: `
Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

Ihr Mietvertrag für ${unit.unit_number || unit.name} läuft am ${new Date(contract.end_date).toLocaleDateString('de-DE')} aus.

Bitte kontaktieren Sie uns, wenn Sie den Vertrag verlängern möchten.

Aktuelle Konditionen:
- Miete: ${contract.total_rent}€/Monat
- Vertragsende: ${new Date(contract.end_date).toLocaleDateString('de-DE')}

Mit freundlichen Grüßen,
Ihre Hausverwaltung
        `
      });

      await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
        user_email: tenant.email,
        title: 'Vertragsverlängerung verfügbar',
        message: `Ihr Mietvertrag läuft in ${days_before_expiry} Tagen aus. Kontaktieren Sie uns für eine Verlängerung.`,
        type: 'contract',
        priority: 'high',
        related_entity_type: 'contract',
        related_entity_id: contract.id
      });

      results.push({ 
        tenant: tenant.email, 
        unit: unit.unit_number,
        end_date: contract.end_date 
      });
    }
  }

  return Response.json({ 
    success: true, 
    notifications_sent: results.length,
    expiring_contracts: results
  });
});