import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { payment_id } = await req.json();
    
    if (!payment_id) {
      return Response.json({ error: 'payment_id required' }, { status: 400 });
    }
    
    // Get payment details
    const payments = await base44.asServiceRole.entities.Payment.filter({ id: payment_id }, null, 1);
    const payment = payments[0];
    
    if (!payment) {
      return Response.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // Get tenant info
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ email: payment.tenant_email }, null, 1);
    const tenant = tenants[0];
    
    if (!tenant?.email) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }
    
    // Generate AI-powered confirmation message
    const aiMessage = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Erstelle eine freundliche Zahlungsbestätigung auf Deutsch für ${tenant.full_name}.
      Details:
      - Betrag: ${payment.amount}€
      - Zahlungsdatum: ${new Date(payment.payment_date).toLocaleDateString('de-DE')}
      - Zahlungsart: ${payment.payment_method || 'Überweisung'}
      
      Die Nachricht soll professionell, dankend und mit einer Zusammenfassung sein.`
    });
    
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: tenant.email,
      subject: `Zahlungsbestätigung - ${payment.amount}€`,
      body: aiMessage,
      from_name: 'Hausverwaltung'
    });
    
    return Response.json({
      success: true,
      payment_id,
      tenant_email: tenant.email
    });
    
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});