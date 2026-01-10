import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const {
      recipient_email,
      notification_type,
      title,
      message,
      related_entity_id,
      action_url,
      metadata
    } = await req.json();

    if (!recipient_email || !notification_type || !title) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user preferences
    const preferences = await base44.asServiceRole.entities.UserPreferences.filter({
      user_email: recipient_email
    });

    const userPrefs = preferences[0] || {};

    if (!userPrefs.notifications_enabled) {
      return Response.json({ success: true, skipped: true });
    }

    // Check if notification type is enabled
    const notificationTypeMap = {
      task_assigned: 'task_assignment_notifications',
      approval_required: 'approval_notifications',
      workflow_status: 'workflow_status_notifications'
    };

    const prefKey = notificationTypeMap[notification_type];
    if (prefKey && !userPrefs[prefKey]) {
      return Response.json({ success: true, skipped: true });
    }

    // Check quiet hours
    if (userPrefs.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (currentTime >= userPrefs.quiet_hours_start && currentTime <= userPrefs.quiet_hours_end) {
        return Response.json({ success: true, skipped: true });
      }
    }

    // Send notifications based on channels
    const channels = userPrefs.notification_channels || ['in_app'];
    const promises = [];

    // In-app notification
    if (channels.includes('in_app')) {
      promises.push(
        base44.asServiceRole.entities.Notification.create({
          recipient_email,
          title,
          message,
          notification_type,
          related_entity_id,
          action_url,
          priority: metadata?.priority || 'medium',
          is_read: false
        })
      );
    }

    // Slack notification
    if (channels.includes('slack') && userPrefs.slack_user_id) {
      const slackToken = await base44.asServiceRole.connectors.getAccessToken('slack');
      
      const slackMessage = {
        channel: userPrefs.slack_user_id,
        text: title,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${title}*\n${message}`
            }
          }
        ]
      };

      if (action_url) {
        slackMessage.blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Ansehen'
              },
              url: action_url
            }
          ]
        });
      }

      promises.push(
        fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${slackToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(slackMessage)
        })
      );
    }

    await Promise.all(promises);

    // Log the notification
    await base44.functions.invoke('logAuditAction', {
      action_type: 'notification_sent',
      entity_type: 'notification',
      entity_id: recipient_email,
      user_email: 'system',
      company_id: metadata?.company_id || 'system',
      description: `Benachrichtigung gesendet: ${title}`,
      metadata: {
        channels: channels,
        notification_type
      }
    });

    return Response.json({
      success: true,
      sent_via: channels
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});