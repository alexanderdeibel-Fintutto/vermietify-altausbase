import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    const { title, message, type, recipient_email, action_url } = body;

    await base44.asServiceRole.entities.Notification.create({
      title,
      message,
      type: type || 'info',
      recipient_email,
      action_url,
      is_read: false,
      channels: JSON.stringify(['in-app'])
    });

    // Send email if specified
    if (recipient_email) {
      await base44.integrations.Core.SendEmail({
        to: recipient_email,
        subject: title,
        body: message
      });
    }

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});