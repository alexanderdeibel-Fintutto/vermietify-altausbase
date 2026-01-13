import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, channels, scheduledAt } = await req.json();

    // Create scheduled notification
    const notification = await base44.entities.Notification?.create?.({
      title: title,
      message: message,
      type: 'info',
      channels: JSON.stringify(channels || ['in-app', 'email']),
      recipient_email: user.email,
      scheduled_at: scheduledAt,
      is_read: false
    });

    return Response.json({
      data: {
        notification_id: notification?.id,
        scheduled_for: scheduledAt
      }
    });

  } catch (error) {
    console.error('Schedule notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});