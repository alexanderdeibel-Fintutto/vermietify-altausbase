import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { document_id, channel } = await req.json();

    const doc = await base44.asServiceRole.entities.Document?.read(document_id);
    if (!doc) return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel,
        text: `Neues Dokument: ${doc.title}`,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '✨ Neues Dokument erstellt' }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Titel:*\n${doc.title}`
              },
              {
                type: 'mrkdwn',
                text: `*Typ:*\n${doc.document_type || 'Unbekannt'}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: doc.description || '_Keine Beschreibung_'
            }
          }
        ]
      })
    });

    const result = await slackRes.json();
    if (!result.ok) throw new Error(result.error);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});