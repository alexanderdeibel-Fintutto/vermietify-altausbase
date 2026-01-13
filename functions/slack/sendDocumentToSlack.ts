import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { document_id, channel, message } = await req.json();

    // Get document
    const doc = await base44.asServiceRole.entities.Document?.read(document_id);
    if (!doc) return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });

    // Get Slack token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    // Send to Slack
    const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `📄 *${doc.title}*\n${message || doc.description || ''}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Dokument anschauen' },
                url: `${Deno.env.get('BASE44_APP_URL')}/documents`
              }
            ]
          }
        ]
      })
    });

    const result = await slackRes.json();
    if (!result.ok) throw new Error(result.error);

    return new Response(JSON.stringify({ success: true, message_ts: result.ts }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});