import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Create sample alert rules
    const rules = [
      {
        name: 'Überdue Invoices',
        entity_type: 'Invoice',
        trigger_condition: JSON.stringify({ field: 'status', operator: 'equals', value: 'overdue' }),
        alert_message: 'Eine Rechnung ist überfällig!',
        channels: JSON.stringify(['in-app', 'email', 'slack']),
        is_active: true
      },
      {
        name: 'Contract Expiring Soon',
        entity_type: 'Contract',
        trigger_condition: JSON.stringify({ field: 'days_until_expiry', operator: 'lt', value: 30 }),
        alert_message: 'Vertrag läuft in weniger als 30 Tagen ab',
        channels: JSON.stringify(['in-app', 'email']),
        is_active: true
      },
      {
        name: 'High Payment Amount',
        entity_type: 'Payment',
        trigger_condition: JSON.stringify({ field: 'amount', operator: 'gt', value: 10000 }),
        alert_message: 'Zahlungseingang über 10.000€ registriert',
        channels: JSON.stringify(['in-app']),
        is_active: true
      }
    ];

    const created = await base44.asServiceRole.entities.AlertRule?.bulkCreate?.(rules);

    // Create sample notifications
    const notifications = [
      {
        title: 'Willkommen in der Benachrichtigungszentrale',
        message: 'Sie erhalten automatische Benachrichtigungen für wichtige Ereignisse',
        type: 'info',
        category: 'system',
        is_read: false,
        recipient_email: user.email,
        channels: JSON.stringify(['in-app'])
      }
    ];

    await base44.asServiceRole.entities.Notification?.bulkCreate?.(notifications);

    return Response.json({
      data: {
        rules_created: created?.length || 0,
        notifications_created: notifications.length
      }
    });

  } catch (error) {
    console.error('Seed data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});