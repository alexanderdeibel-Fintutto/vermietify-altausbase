import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const {
      user_email,
      title,
      message,
      type = 'system',
      priority = 'normal',
      related_entity_type,
      related_entity_id
    } = await req.json();

    if (!user_email || !title || !message) {
      return Response.json({ error: 'user_email, title, and message required' }, { status: 400 });
    }

    // Get user preferences
    const preferences = await base44.asServiceRole.entities.NotificationPreference.filter(
      { user_email },
      null,
      1
    );
    const userPrefs = preferences[0];

    // Check if notification should be sent based on preferences
    const shouldSendNotification = () => {
      if (!userPrefs) return true; // Default to sending if no preferences

      // Check priority filter
      if (userPrefs.priority_filter === 'high' && !['high', 'critical'].includes(priority)) return false;
      if (userPrefs.priority_filter === 'critical' && priority !== 'critical') return false;

      // Check quiet hours
      if (userPrefs.quiet_hours_enabled && priority !== 'critical') {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (currentTime >= userPrefs.quiet_hours_start && currentTime <= userPrefs.quiet_hours_end) {
          return false;
        }
      }

      return true;
    };

    if (!shouldSendNotification()) {
      return Response.json({ 
        success: true, 
        message: 'Notification blocked by user preferences',
        notification_sent: false 
      });
    }

    // Create in-app notification
    let notification = null;
    if (userPrefs?.in_app_enabled !== false) {
      notification = await base44.asServiceRole.entities.Notification.create({
        user_email,
        title,
        message,
        type,
        priority,
        related_entity_type,
        related_entity_id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    // Send email notification
    if (userPrefs?.email_enabled !== false) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user_email,
        subject: `${priority === 'critical' ? '🚨 DRINGEND: ' : ''}${title}`,
        body: `${message}

---
Diese Benachrichtigung wurde automatisch vom System gesendet.
Sie können Ihre Benachrichtigungseinstellungen im Portal anpassen.`
      });
    }

    // Send push notification
    if (userPrefs?.push_enabled && ['high', 'critical'].includes(priority)) {
      await base44.asServiceRole.entities.Notification.update(notification.id, {
        sent_via_push: true
      });
    }

    return Response.json({
      success: true,
      notification_id: notification?.id,
      sent_via_email: userPrefs?.email_enabled !== false,
      sent_via_push: userPrefs?.push_enabled && ['high', 'critical'].includes(priority),
      sent_in_app: userPrefs?.in_app_enabled !== false
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});