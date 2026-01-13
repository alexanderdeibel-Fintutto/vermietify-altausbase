import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data, channel } = await req.json();

    // Get Slack access token
    const slackToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    if (!slackToken) {
      return Response.json({ error: 'Slack not connected' }, { status: 400 });
    }

    // Format message based on event type
    let message = '';
    let color = '#3b82f6';

    if (event === 'invoice.created') {
      message = `🧾 Neue Rechnung\n${data.number} - €${data.amount}\nVon: ${data.from}`;
      color = '#3b82f6';
    } else if (event === 'invoice.paid') {
      message = `💳 Rechnung bezahlt\n${data.number}\n€${data.amount}`;
      color = '#10b981';
    } else if (event === 'contract.created') {
      message = `📋 Neuer Vertrag\n${data.tenant_name}\nVon: ${data.start_date}`;
      color = '#8b5cf6';
    } else if (event === 'payment.received') {
      message = `💰 Zahlung empfangen\n€${data.amount}\nVon: ${data.payer}`;
      color = '#10b981';
    }

    // Send to Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel || '#notifications',
        text: message,
        attachments: [
          {
            color: color,
            text: message,
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error);
    }

    return Response.json({ success: true, message_ts: result.ts });

  } catch (error) {
    console.error('Slack notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});