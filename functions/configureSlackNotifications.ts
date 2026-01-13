import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channel, enabledNotifications } = await req.json();

    // Get Slack access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    if (!accessToken) {
      return Response.json({ error: 'Slack not authorized' }, { status: 401 });
    }

    // Test channel connectivity
    const testResponse = await fetch('https://slack.com/api/conversations.list', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const conversationsData = await testResponse.json();
    if (!conversationsData.ok) {
      return Response.json({ error: 'Slack API error: ' + conversationsData.error }, { status: 400 });
    }

    // Store config (in practice, save to user prefs)
    return Response.json({
      data: {
        channel: channel,
        enabledNotifications: enabledNotifications,
        configured: true
      }
    });

  } catch (error) {
    console.error('Slack config error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});