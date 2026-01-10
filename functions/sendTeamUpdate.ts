import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, channel = 'general' } = await req.json();

    // Get Slack access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    // Send to Slack
    const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel,
        text: `📱 *${user.full_name}* (Vermieter Go):\n${message}`,
        username: 'Vermieter Go',
        icon_emoji: ':house:'
      })
    });

    const result = await slackResponse.json();

    if (!result.ok) {
      throw new Error(result.error || 'Slack API error');
    }

    return Response.json({ 
      success: true,
      message_sent: message
    });

  } catch (error) {
    console.error('Team update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});