import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { user_id, title, message, type = 'info', entity_type, entity_id, action_url } = await req.json();

    if (!user_id || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id,
      title,
      message,
      type,
      entity_type,
      entity_id,
      action_url,
      is_read: false
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});