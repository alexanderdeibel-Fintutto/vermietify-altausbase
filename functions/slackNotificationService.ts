import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_type, title, description, channel, building_id } = await req.json();

    // Get Slack access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    if (!accessToken) {
      return Response.json({ error: 'Slack nicht verbunden' }, { status: 401 });
    }

    // Prepare Slack message
    const color = {
      alert: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      success: '#10b981'
    }[event_type] || '#64748b';

    const slackMessage = {
      channel: channel || '#general',
      attachments: [
        {
          color: color,
          title: title,
          text: description,
          footer: 'FinX Automation',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    // Send to Slack
    const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackMessage)
    });

    const result = await slackResponse.json();

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message_ts: result.ts,
      channel: result.channel 
    });

  } catch (error) {
    console.error('Slack error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});