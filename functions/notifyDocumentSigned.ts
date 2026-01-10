import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, signer_name, company_name, signature_url } = await req.json();

    // Send Slack notification
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: '#documents',
        text: `📄 Dokument signiert: ${company_name}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Dokument signiert*\n*Firma:* ${company_name}\n*Unterzeichner:* ${signer_name}\n*Datum:* ${new Date().toLocaleString('de-DE')}`
            }
          },
          {
            type: 'image',
            image_url: signature_url,
            alt_text: 'Signature'
          }
        ]
      })
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});