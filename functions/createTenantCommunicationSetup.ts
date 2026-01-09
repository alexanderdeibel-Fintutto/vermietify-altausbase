import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tenant_id, tenant_email, tenant_name } = await req.json();

    if (!tenant_id || !tenant_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const communicationSetups = [];

    // Create default email communication channel
    const emailChannel = await base44.asServiceRole.entities.TenantCommunication.create({
      tenant_id,
      communication_type: 'email',
      channel: 'email',
      recipient: tenant_email,
      subject: 'Initial Communication Setup',
      message: `Willkommen ${tenant_name}! Ihre Kommunikationskanäle wurden eingerichtet.`,
      status: 'active',
      is_default: true
    });
    communicationSetups.push({ type: 'email', id: emailChannel.id });

    // Create notification preferences for tenant
    const notificationPrefs = await base44.asServiceRole.entities.NotificationPreference.create({
      tenant_id,
      notify_on_messages: true,
      notify_on_maintenance: true,
      notify_on_documents: true,
      notify_on_payments: true,
      notification_method: 'email',
      preferred_email: tenant_email,
      is_active: true
    });
    communicationSetups.push({ type: 'notification_preferences', id: notificationPrefs.id });

    return Response.json({
      success: true,
      communication_setups: communicationSetups,
      message: 'Communication channels established successfully'
    });
  } catch (error) {
    console.error('Error setting up tenant communication:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});