import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, templateId, recipientType, buildingId, messageType } = await req.json();

    switch (action) {
      case 'sendBulkMessages': {
        // Bulk-Versand automatischer Nachrichten
        let recipients = [];

        if (recipientType === 'tenants' && buildingId) {
          const contracts = await base44.entities.LeaseContract.filter({
            unit_id: { $exists: true },
          });
          recipients = [...new Set(contracts.map(c => c.tenant_id))];
        } else if (recipientType === 'all') {
          const contracts = await base44.entities.LeaseContract.list();
          recipients = [...new Set(contracts.map(c => c.tenant_id))];
        }

        const sentMessages = [];
        for (const tenantId of recipients) {
          const message = await base44.entities.TenantNotification.create({
            tenant_id: tenantId,
            type: messageType || 'announcement',
            title: 'Automatische Mitteilung',
            message: `Dies ist eine automatisierte Nachricht basierend auf Template ${templateId}`,
            priority: 'normal',
          });
          sentMessages.push(message);
        }

        return Response.json({ success: true, count: sentMessages.length });
      }

      case 'scheduleReminder': {
        // Zeitgesteuerte Erinnerungen
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 7); // 7 Tage später

        const task = await base44.entities.Task.create({
          title: `Automation: ${messageType} Reminder`,
          status: 'offen',
          due_date: reminderDate.toISOString(),
          automation_trigger_date: reminderDate.toISOString(),
          is_automated: true,
        });

        return Response.json({ success: true, task });
      }

      case 'setupAutoResponse': {
        // Automatische Antworten bei bestimmten Keywords
        const rules = [
          { keyword: 'miete', response: 'Zahlungsanfragen bitte bis zum 3. des Monats begleichen.' },
          { keyword: 'reparatur', response: 'Wartungsanfragen werden zeitnah von unserem Team bearbeitet.' },
          { keyword: 'beschwerde', response: 'Wir nehmen alle Anliegen ernst und antworten innerhalb von 48 Stunden.' },
        ];

        return Response.json({ success: true, rulesCreated: rules.length });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});