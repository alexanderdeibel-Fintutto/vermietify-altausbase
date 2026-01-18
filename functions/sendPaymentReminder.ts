import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenant_id, amount, due_date } = body;

    const tenant = await base44.entities.Tenant.get(tenant_id);
    
    if (!tenant || !tenant.email) {
      return Response.json({ error: 'Tenant not found or no email' }, { status: 404 });
    }

    await base44.integrations.Core.SendEmail({
      to: tenant.email,
      subject: 'Zahlungserinnerung - Mieteingang',
      body: `Sehr geehrte/r ${tenant.name},\n\nwir möchten Sie freundlich daran erinnern, dass die Mietzahlung in Höhe von ${amount}€ am ${new Date(due_date).toLocaleDateString('de-DE')} fällig war.\n\nBitte überweisen Sie den Betrag zeitnah.\n\nMit freundlichen Grüßen`
    });

    await base44.entities.Notification.create({
      title: 'Zahlungserinnerung versendet',
      message: `An ${tenant.name} (${amount}€)`,
      type: 'info',
      recipient_email: user.email
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});