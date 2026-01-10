import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      recipient_email,
      title,
      message,
      notification_type,
      related_entity_type,
      related_entity_id,
      priority = 'medium',
      action_url
    } = await req.json();

    // Create in-app notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      recipient_email,
      title,
      message,
      notification_type,
      related_entity_type,
      related_entity_id,
      priority,
      action_url,
      sent_via_slack: false
    });

    // Send via Slack
    let sentViaSlack = false;
    try {
      const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');
      
      // Get user's Slack ID
      const userResponse = await fetch('https://slack.com/api/users.lookupByEmail?email=' + encodeURIComponent(recipient_email), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const userData = await userResponse.json();

      if (userData.ok && userData.user) {
        const priorityEmoji = {
          urgent: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🔵'
        };

        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: userData.user.id,
            text: `${priorityEmoji[priority]} ${title}`,
            blocks: [{
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${priorityEmoji[priority]} *${title}*\n${message}`
              }
            }]
          })
        });

        sentViaSlack = true;
      }
    } catch (error) {
      console.log('Slack notification optional:', error.message);
    }

    // Update notification with Slack status
    if (sentViaSlack) {
      await base44.asServiceRole.entities.Notification.update(notification.id, {
        sent_via_slack: true
      });
    }

    return Response.json({ success: true, notification_id: notification.id, sent_via_slack: sentViaSlack });
  } catch (error) {
    console.error('Send notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});