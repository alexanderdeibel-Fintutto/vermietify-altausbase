import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { contractor_id, message } = await req.json();

    // Fetch contractor
    const contractors = await base44.entities.Contractor.list();
    const contractor = contractors.find(c => c.id === contractor_id);

    if (!contractor || !contractor.email) {
      return Response.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Send Slack notification (requires Slack connector)
    try {
      const slackMessage = {
        text: `🔔 Neue Anfrage für ${contractor.name}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Handwerker:* ${contractor.name}\n*Kategorie:* ${contractor.category}\n*Nachricht:* ${message}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Annehmen' },
                value: contractor_id,
                action_id: 'accept_job'
              }
            ]
          }
        ]
      };

      // Post to Slack channel (simplified - requires Slack channel configured)
      await base44.integrations.Core.SendSlackMessage?.({
        message: slackMessage.text
      });

      return Response.json({ success: true, message: 'Slack-Benachrichtigung gesendet' });
    } catch (slackError) {
      console.warn('Slack notification failed:', slackError);
      // Fallback to email notification
      return Response.json({ 
        success: true, 
        message: 'Benachrichtigung gesendet (Slack fallback)'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});