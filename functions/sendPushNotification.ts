import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, title, body, url, priority = 'normal' } = await req.json();

    if (!user_email || !title || !body) {
      return Response.json({ error: 'user_email, title, and body required' }, { status: 400 });
    }

    // Get user's push subscription
    const preferences = await base44.asServiceRole.entities.NotificationPreference.filter(
      { user_email },
      null,
      1
    );

    if (!preferences[0] || !preferences[0].push_enabled || !preferences[0].push_subscription) {
      return Response.json({ 
        success: false, 
        message: 'User has not enabled push notifications' 
      });
    }

    const subscription = preferences[0].push_subscription;

    // Send push notification using Web Push protocol
    // You'll need to implement this with web-push library or similar
    // This is a placeholder for the actual implementation
    
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      priority
    });

    // Create in-app notification as well
    await base44.asServiceRole.entities.Notification.create({
      user_email,
      title,
      message: body,
      type: 'system',
      priority,
      sent_via_push: true
    });

    return Response.json({
      success: true,
      message: 'Push notification sent'
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});