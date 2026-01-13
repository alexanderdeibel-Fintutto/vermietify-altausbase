import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, type, category, channels, actionUrl, scheduledAt } = await req.json();

    // Create notification
    const notification = await base44.entities.Notification?.create?.({
      title: title,
      message: message,
      type: type || 'info',
      category: category,
      action_url: actionUrl,
      channels: JSON.stringify(channels || ['in-app']),
      recipient_email: user.email,
      scheduled_at: scheduledAt,
      is_read: false
    });

    // Send via channels
    if (channels?.includes('email')) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: title,
          body: `<h2>${title}</h2><p>${message}</p>`
        });
      } catch (e) {
        console.error('Email send error:', e);
      }
    }

    if (channels?.includes('in-app')) {
      // Already created above
    }

    return Response.json({
      data: {
        notification_id: notification?.id,
        sent: true,
        channels: channels
      }
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});