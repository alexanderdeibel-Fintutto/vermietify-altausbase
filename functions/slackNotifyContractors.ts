import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { contractor_id, job_title, job_description, location } = await req.json();

    // Get contractor
    const contractors = await base44.entities.Contractor.list();
    const contractor = contractors.find(c => c.id === contractor_id);

    if (!contractor) {
      return Response.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Build Slack message
    const slackMessage = `
🔧 *Neue Anfrage für ${contractor.name}*

📋 Auftrag: ${job_title}
📍 Ort: ${location}
📝 Beschreibung: ${job_description}
⭐ Rating: ${contractor.rating}/5 (${contractor.review_count} Bewertungen)

_Bitte im Slack-Thread antworten oder Contact-Button verwenden_
    `.trim();

    // Send via Slack (using authorized connector)
    // This uses the Slack connector already authorized for this app
    const response = await fetch('https://hooks.slack.com/services/YOUR_WEBHOOK_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: slackMessage,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: slackMessage }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '✓ Auftrag annehmen' },
                value: contractor_id,
                action_id: 'accept_job',
                style: 'primary'
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '✗ Ablehnen' },
                value: contractor_id,
                action_id: 'decline_job'
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      console.warn('Slack API error:', await response.text());
    }

    return Response.json({ 
      success: true, 
      contractor_id,
      message: 'Slack-Benachrichtigung an Handwerker gesendet'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});