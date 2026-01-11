import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { debt_id, action, reminder_level = 1 } = await req.json();
    const debt = await base44.asServiceRole.entities.RentDebt.read(debt_id);
    const tenant = await base44.asServiceRole.entities.Tenant.read(debt.tenant_id);

    if (action === 'send_reminder') {
      const reminderTypes = {
        1: { type: 'reminder', subject: 'Freundliche Zahlungserinnerung' },
        2: { type: 'warning', subject: 'Zahlungsaufforderung - 2. Mahnung' },
        3: { type: 'legal', subject: 'Letzte Mahnung vor rechtlichen Schritten' }
      };

      const reminder = reminderTypes[reminder_level];

      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: reminder.subject,
        body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

wir haben festgestellt, dass folgende Mietzahlungen noch ausstehen:

Gesamtschulden: ${debt.total_debt}€

Bitte begleichen Sie die ausstehenden Beträge umgehend.

Mit freundlichen Grüßen`
      });

      const updatedReminders = [...(debt.reminders_sent || []), {
        level: reminder_level,
        sent_date: new Date().toISOString().split('T')[0],
        type: reminder.type
      }];

      await base44.asServiceRole.entities.RentDebt.update(debt_id, {
        reminders_sent: updatedReminders,
        status: reminder_level >= 3 ? 'legal_action' : 'active'
      });

      return Response.json({ success: true });
    }

    if (action === 'create_payment_plan') {
      const { installments, amount_per_month } = await req.json();

      await base44.asServiceRole.entities.RentDebt.update(debt_id, {
        payment_plan: {
          installments,
          amount_per_month,
          start_date: new Date().toISOString().split('T')[0]
        },
        status: 'payment_plan'
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});