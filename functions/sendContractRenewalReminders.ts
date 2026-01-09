import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active contracts
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ status: 'active' });
    
    const today = new Date();
    const remindersSent = [];
    
    for (const contract of contracts) {
      if (contract.is_unlimited) continue;
      
      const endDate = new Date(contract.end_date);
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      // Send reminders at 90, 60, 30 days before expiry
      const shouldRemind = daysUntilExpiry === 90 || daysUntilExpiry === 60 || daysUntilExpiry === 30;
      
      if (shouldRemind) {
        // Get tenant info
        const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: contract.tenant_id }, null, 1);
        const tenant = tenants[0];
        
        // Get admin users
        const admins = await base44.asServiceRole.entities.User.list();
        const adminEmails = admins.filter(u => u.role === 'admin').map(u => u.email);
        
        // Generate AI reminder message
        const aiMessage = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Erstelle eine professionelle Erinnerung für Admins auf Deutsch über einen auslaufenden Mietvertrag.
          
          Details:
          - Mieter: ${tenant?.full_name || 'Unbekannt'}
          - Vertragsenddatum: ${new Date(contract.end_date).toLocaleDateString('de-DE')}
          - Tage bis Ablauf: ${daysUntilExpiry}
          - Kündigungsfrist: ${contract.notice_period_months || 3} Monate
          - Monatliche Miete: ${contract.total_rent}€
          
          Die Nachricht soll klar, handlungsorientiert sein und nächste Schritte vorschlagen.`
        });
        
        // Send to all admins
        for (const adminEmail of adminEmails) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: adminEmail,
            subject: `⏰ Vertragsverlängerung fällig: ${tenant?.full_name} (${daysUntilExpiry} Tage)`,
            body: aiMessage,
            from_name: 'Hausverwaltung'
          });
          
          // Create notification
          await base44.asServiceRole.entities.Notification.create({
            user_email: adminEmail,
            title: 'Vertragsverlängerung erforderlich',
            message: `Mietvertrag von ${tenant?.full_name} läuft in ${daysUntilExpiry} Tagen ab`,
            type: 'contract_renewal',
            priority: daysUntilExpiry <= 30 ? 'high' : 'normal',
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
        
        remindersSent.push({
          contract_id: contract.id,
          tenant_name: tenant?.full_name,
          days_until_expiry: daysUntilExpiry,
          admins_notified: adminEmails.length
        });
      }
    }
    
    return Response.json({
      success: true,
      reminders_sent: remindersSent.length,
      contracts_checked: contracts.length,
      details: remindersSent
    });
    
  } catch (error) {
    console.error('Error sending renewal reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});