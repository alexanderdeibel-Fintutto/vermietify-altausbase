import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { payment_id } = body;

    const payment = await base44.entities.ActualPayment.get(payment_id);
    const tenant = await base44.entities.Tenant.get(payment.tenant_id);

    await base44.integrations.Core.SendEmail({
      to: tenant.email,
      subject: 'Zahlungserinnerung - Fällige Miete',
      from_name: 'Ihre Hausverwaltung',
      body: `Sehr geehrte/r ${tenant.name},

dies ist eine freundliche Erinnerung, dass die folgende Zahlung fällig ist:

Betrag: €${payment.amount}
Fälligkeitsdatum: ${new Date(payment.due_date).toLocaleDateString('de-DE')}

Bitte überweisen Sie den Betrag zeitnah auf das bekannte Konto.

Mit freundlichen Grüßen
Ihre Hausverwaltung`
    });

    await base44.entities.Notification.create({
      title: 'Zahlungserinnerung gesendet',
      message: `Erinnerung an ${tenant.name} gesendet`,
      type: 'info',
      recipient_email: user.email
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});