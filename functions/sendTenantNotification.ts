import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { tenant_id, company_id, notification_type, title, message, related_entity_id, priority = 'medium' } = await req.json();
    
    // Create notification
    const notification = await base44.asServiceRole.entities.TenantNotification.create({
      tenant_id,
      company_id,
      notification_type,
      title,
      message,
      related_entity_id,
      priority,
      is_read: false,
      sent_at: new Date().toISOString()
    });
    
    // Get tenant app session for push token
    const sessions = await base44.asServiceRole.entities.TenantAppSession.filter({ tenant_id });
    const session = sessions[0];
    
    // If push token exists, send push notification (in production: use Firebase/APNs)
    if (session?.push_token) {
      console.log(`Would send push notification to token: ${session.push_token}`);
      // await sendPushNotification(session.push_token, { title, message });
    }
    
    // Send email notification for high priority
    if (priority === 'high') {
      const tenant = await base44.asServiceRole.entities.Tenant.read(tenant_id);
      if (tenant?.email) {
        await base44.integrations.Core.SendEmail({
          to: tenant.email,
          subject: `🔔 ${title}`,
          body: `Hallo,\n\n${message}\n\nBitte melden Sie sich in Ihrem Mieterportal an, um Details zu sehen.\n\nMit freundlichen Grüßen`
        });
      }
    }
    
    return Response.json({ success: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});