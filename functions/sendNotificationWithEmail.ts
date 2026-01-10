import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { 
    user_email, 
    title, 
    message, 
    type, 
    priority = 'normal',
    related_entity_type,
    related_entity_id,
    action_url 
  } = await req.json();

  // Create in-app notification
  const notification = await base44.asServiceRole.entities.Notification.create({
    user_email,
    title,
    message,
    type,
    priority,
    is_read: false,
    related_entity_type,
    related_entity_id,
    action_url,
    sent_via_email: false,
    sent_via_push: false
  });

  // Check user preferences
  const preferences = await base44.asServiceRole.entities.NotificationPreference.filter({ 
    user_email 
  });
  const userPrefs = preferences[0];

  // Send email if enabled
  if (userPrefs?.email_enabled && shouldSendEmail(type, userPrefs)) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user_email,
        subject: title,
        body: `
          <h2>${title}</h2>
          <p>${message}</p>
          ${action_url ? `<p><a href="${action_url}">Jetzt ansehen</a></p>` : ''}
          <hr>
          <p style="font-size: 12px; color: #666;">
            Sie können Ihre Benachrichtigungseinstellungen jederzeit in Ihrem Profil ändern.
          </p>
        `
      });

      await base44.asServiceRole.entities.Notification.update(notification.id, {
        sent_via_email: true
      });
    } catch (error) {
      console.error('Email send failed:', error);
    }
  }

  return Response.json({ 
    success: true, 
    notification_id: notification.id 
  });
});

function shouldSendEmail(type, preferences) {
  if (!preferences) return true;

  const typeMap = {
    payment: 'payment_reminders',
    maintenance: 'maintenance_updates',
    contract: 'contract_renewals',
    message: 'new_messages',
    document: 'document_updates',
    system: 'system_updates'
  };

  const prefKey = typeMap[type];
  return prefKey ? preferences[prefKey] !== false : true;
}