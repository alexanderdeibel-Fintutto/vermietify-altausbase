import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, data } = await req.json();

    if (action === 'sendBulkMessages') {
      const { buildingIds, messageType, customMessage, channel } = data;

      let totalSent = 0;

      for (const buildingId of buildingIds) {
        // Hole alle Mieter für das Gebäude
        const tenants = await base44.entities.Tenant.list();
        const leaseContracts = await base44.entities.LeaseContract.filter({
          building_id: buildingId,
          status: 'active',
        });

        for (const contract of leaseContracts) {
          const tenant = tenants.find(t => t.id === contract.tenant_id);
          if (!tenant) continue;

          // Erstelle Benachrichtigung
          await base44.entities.TenantNotification.create({
            tenant_id: tenant.id,
            type: messageType || 'other',
            title: `Mitteilung vom ${new Date().toLocaleDateString('de-DE')}`,
            message: customMessage || 'Neue Mitteilung von Ihrer Hausverwaltung',
            is_read: false,
            priority: 'normal',
          });

          totalSent++;
        }
      }

      return Response.json({
        success: true,
        message: `${totalSent} Benachrichtigungen versendet`,
        count: totalSent,
      });
    }

    if (action === 'scheduleAutomation') {
      const { buildingIds, trigger, channel, messageTemplate, frequency } = data;

      // Erstelle WorkflowAutomation Eintrag
      const automation = await base44.entities.WorkflowAutomation.create({
        title: `${trigger} - Automatisiert`,
        trigger_event: trigger,
        channel: channel || 'email',
        enabled: true,
        buildings: buildingIds,
        message_template: messageTemplate,
        frequency: frequency || 'monthly',
      });

      return Response.json({
        success: true,
        automation,
        message: 'Automatisierung eingerichtet',
      });
    }

    if (action === 'toggleAutomation') {
      const { automationId, enabled } = data;

      const automation = await base44.entities.WorkflowAutomation.update(automationId, {
        enabled: enabled,
      });

      return Response.json({
        success: true,
        automation,
      });
    }

    if (action === 'testMessage') {
      const { recipientEmail, messageContent } = data;

      // Mock email send
      console.log(`Test email sent to ${recipientEmail}: ${messageContent}`);

      return Response.json({
        success: true,
        message: `Test-Nachricht an ${recipientEmail} versendet`,
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Automated communication error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});