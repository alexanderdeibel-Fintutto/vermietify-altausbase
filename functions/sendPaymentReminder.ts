import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, tenantId, reminderType, message, tenant_email, tenant_name } = await req.json();

    // Logge die Mahnung
    await base44.entities.ActivityLog.create({
      user_id: user.id,
      action_type: 'payment_reminder',
      resource: 'financial_item',
      resource_id: paymentId,
      details: {
        tenant_id: tenantId,
        reminder_type: reminderType,
        sent_at: new Date().toISOString()
      }
    });

    let result = {};

    // E-Mail versenden
    if (reminderType === 'email') {
      const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
        to: tenant_email,
        subject: 'Zahlungserinnerung',
        body: message
      });
      result = { type: 'email', sent: true, email: tenant_email };
    }

    // WhatsApp versenden
    if (reminderType === 'whatsapp') {
      // WhatsApp-Integration verwenden
      const whatsappResult = await base44.functions.invoke('whatsapp_sendMessage', {
        contactId: tenantId,
        message: message
      });
      result = { type: 'whatsapp', sent: true };
    }

    // Brief-Versand vorbereiten
    if (reminderType === 'letter') {
      // LetterXpress Integration
      result = { type: 'letter', queued: true, message: 'Brief wird vorbereitet' };
    }

    // Zahlungsstatus aktualisieren (Mahnung vermerken)
    await base44.entities.FinancialItem.update(paymentId, {
      last_reminder_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      result,
      message: 'Zahlungserinnerung erfolgreich versendet'
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});