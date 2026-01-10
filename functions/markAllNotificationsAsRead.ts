import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unread notifications
    const notifications = await base44.entities.Notification.filter({
      user_email: user.email,
      is_read: false
    });

    // Mark all as read
    const updates = await Promise.all(
      notifications.map(n =>
        base44.entities.Notification.update(n.id, {
          is_read: true,
          read_at: new Date().toISOString()
        })
      )
    );

    return Response.json({ 
      message: `${updates.length} Benachrichtigungen als gelesen markiert`,
      count: updates.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});