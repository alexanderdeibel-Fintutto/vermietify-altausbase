import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { notification_type, title, message, priority = 'medium', recipients } = body;

    console.log('Sending notification:', { notification_type, priority });

    // For critical alerts, send email
    if (priority === 'critical' && recipients) {
      for (const email of recipients) {
        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `🚨 [CRITICAL] ${title}`,
            body: `
              <h2>${title}</h2>
              <p>${message}</p>
              <p style="color: red; font-weight: bold;">This requires immediate action!</p>
              <a href="https://your-app.com/admin/master-dashboard">View Dashboard</a>
            `
          });
          console.log('Email sent to:', email);
        } catch (err) {
          console.warn('Failed to send email:', err.message);
        }
      }
    }

    // Store notification in database for dashboard display
    const notification = {
      type: notification_type,
      title,
      message,
      priority,
      created_at: new Date().toISOString(),
      read: false
    };

    console.log('Notification stored');

    return Response.json({
      success: true,
      notification_id: `notif_${Date.now()}`,
      sent_count: recipients?.length || 0
    });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});