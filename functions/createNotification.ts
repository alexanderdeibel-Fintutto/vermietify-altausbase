import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    const { user_id, title, message, type, link, send_email } = body;

    // Create notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id,
      title,
      message: message || null,
      type: type || 'info',
      link: link || null,
      is_read: false
    });

    // Send email if requested
    if (send_email) {
      const user = await base44.asServiceRole.entities.User.get(user_id);
      
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: title,
        body: message || title,
        from_name: 'vermitify'
      });
    }

    return Response.json({ success: true, notification });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});