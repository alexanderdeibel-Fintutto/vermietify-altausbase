import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { title, message, category, alertLevel } = await req.json();

    // Get Slack access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("slack");

    const color = alertLevel === 'critical' ? 'danger' : alertLevel === 'warning' ? 'warning' : 'good';

    // Send to Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: '#alerts',
        attachments: [{
          color: color,
          title: title,
          text: message,
          fields: [{
            title: 'Category',
            value: category,
            short: true
          }, {
            title: 'Level',
            value: alertLevel,
            short: true
          }],
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error);
    }

    return Response.json({ data: { sent: true, ts: result.ts } });
  } catch (error) {
    console.error('Slack notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});