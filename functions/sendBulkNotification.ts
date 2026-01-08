import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { user_ids, title, message, type = 'info' } = await req.json();

    if (!user_ids || !Array.isArray(user_ids) || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notifications = await Promise.all(
      user_ids.map(user_id =>
        base44.asServiceRole.entities.Notification.create({
          user_id,
          title,
          message,
          type,
          is_read: false
        })
      )
    );

    return Response.json({ 
      success: true, 
      count: notifications.length,
      message: `${notifications.length} Benachrichtigungen versendet` 
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});