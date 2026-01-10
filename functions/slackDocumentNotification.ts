import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { slack_channel, document_id, action, document_name } = await req.json();

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    const messages = {
      created: `📄 Neues Dokument: *${document_name}*`,
      approved: `✅ Dokument genehmigt: *${document_name}*`,
      rejected: `❌ Dokument abgelehnt: *${document_name}*`,
      completed: `🎉 Workflow abgeschlossen für: *${document_name}*`
    };

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: slack_channel,
        text: messages[action] || `Dokument-Update: ${document_name}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: messages[action] || `Dokument-Update: ${document_name}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Dokument öffnen' },
                url: `https://app.example.com/documents/${document_id}`,
                action_id: 'open_document'
              }
            ]
          }
        ]
      })
    });

    return Response.json({ success: true, slack_response: await res.json() });
  } catch (error) {
    console.error('Slack notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});