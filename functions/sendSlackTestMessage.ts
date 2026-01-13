import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channel } = await req.json();

    // Get Slack access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    // Send test message
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel,
        text: '✅ Test message from Integration API',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Integration API is connected!*\n\nThis is a test message. Your Slack integration is working correctly.'
            }
          }
        ]
      })
    });

    const result = await response.json();

    if (!result.ok) {
      return Response.json({ error: 'Slack API error: ' + result.error }, { status: 400 });
    }

    return Response.json({
      data: {
        success: true,
        message: 'Test message sent'
      }
    });

  } catch (error) {
    console.error('Send Slack message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});