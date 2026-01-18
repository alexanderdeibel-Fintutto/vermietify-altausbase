import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    const payload = await req.json();
    const { subject, message, category, priority } = payload;

    // Create support ticket
    const ticket = await base44.asServiceRole.entities.SupportTicket.create({
      user_email: user?.email || payload.email,
      subject,
      message,
      category: category || 'general',
      priority: priority || 'normal',
      status: 'open'
    });

    // Send notification to support team via Slack
    try {
      const slackToken = await base44.asServiceRole.connectors.getAccessToken('slack');
      
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${slackToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: '#support',
          text: `🎫 Neues Support-Ticket #${ticket.id.substring(0, 8)}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Neues Support-Ticket*\n\n*Von:* ${user?.full_name || payload.name} (${user?.email || payload.email})\n*Betreff:* ${subject}\n*Kategorie:* ${category || 'Allgemein'}\n*Priorität:* ${priority || 'Normal'}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Nachricht:*\n${message.substring(0, 200)}${message.length > 200 ? '...' : ''}`
              }
            }
          ]
        })
      });
    } catch (slackError) {
      console.log('Slack notification failed:', slackError.message);
    }

    // Send confirmation email
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Vermitify Support',
      to: user?.email || payload.email,
      subject: `Support-Ticket erstellt: ${subject}`,
      body: `
Hallo ${user?.full_name || payload.name},

Ihr Support-Ticket wurde erfolgreich erstellt.

Ticket-ID: #${ticket.id.substring(0, 8)}
Betreff: ${subject}

Wir werden uns so schnell wie möglich bei Ihnen melden.

Mit freundlichen Grüßen
Ihr Vermitify Support Team
      `
    });

    return Response.json({
      success: true,
      ticket_id: ticket.id
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});