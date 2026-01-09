import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all unpaid invoices due in the next 7 days
    const allInvoices = await base44.asServiceRole.entities.Invoice.filter(
      { status: 'issued' },
      'due_date',
      1000
    );

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingInvoices = allInvoices.filter(inv => {
      const dueDate = new Date(inv.due_date);
      return dueDate >= now && dueDate <= sevenDaysFromNow;
    });

    let remindersSent = 0;

    for (const invoice of upcomingInvoices) {
      try {
        const tenant = await base44.asServiceRole.entities.Tenant.read(invoice.tenant_id);
        const daysUntilDue = Math.ceil(
          (new Date(invoice.due_date) - now) / (1000 * 60 * 60 * 24)
        );

        // Send email reminder
        await base44.integrations.Core.SendEmail({
          to: tenant.email,
          subject: `Zahlungserinnerung: Rechnung ${invoice.invoice_number}`,
          body: `
            <h2>Zahlungserinnerung</h2>
            <p>Lieber ${tenant.first_name},</p>
            <p>die folgende Rechnung ist in ${daysUntilDue} Tagen fällig:</p>
            <p>
              <strong>Rechnungsnummer:</strong> ${invoice.invoice_number}<br />
              <strong>Betrag:</strong> €${invoice.total_amount.toFixed(2)}<br />
              <strong>Fällig am:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}
            </p>
            <p>Sie können die Zahlung direkt in Ihrem Mieterportal vornehmen.</p>
            <p>Mit freundlichen Grüßen,<br />Ihr Verwaltungsteam</p>
          `,
        });

        // Create notification record
        await base44.asServiceRole.entities.Notification.create({
          user_id: tenant.id,
          user_email: tenant.email,
          title: 'Zahlungserinnerung',
          message: `Rechnung ${invoice.invoice_number} ist in ${daysUntilDue} Tagen fällig`,
          notification_type: 'payment_reminder',
          priority: daysUntilDue <= 2 ? 'high' : 'normal',
          is_sent: true,
          sent_at: new Date().toISOString(),
          related_entity_type: 'invoice',
          related_entity_id: invoice.id,
        });

        remindersSent++;
      } catch (err) {
        console.error(`Error sending reminder for invoice ${invoice.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      remindersSent,
      totalProcessed: upcomingInvoices.length,
    });
  } catch (error) {
    console.error('Payment reminders error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});