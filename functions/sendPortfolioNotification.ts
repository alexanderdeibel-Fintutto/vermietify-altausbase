import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, type, title, message, severity = 'info', channels = ['in_app', 'email'] } = await req.json();

    // Create in-app notification
    const notification = await base44.asServiceRole.entities.PortfolioNotification.create({
      user_id: userId,
      type,
      title,
      message,
      severity,
      delivery_channels: channels,
      sent_at: new Date().toISOString()
    });

    // Send email if enabled
    if (channels.includes('email')) {
      const user = await base44.asServiceRole.entities.User.filter({ id: userId });
      if (user?.[0]?.email) {
        await base44.integrations.Core.SendEmail({
          to: user[0].email,
          subject: `[Portfolio] ${title}`,
          body: message
        });
      }
    }

    console.log(`Notification sent to ${userId}: ${title}`);

    return Response.json({ success: true, notification });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});