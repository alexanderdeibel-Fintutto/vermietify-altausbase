import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shares, revoker_email } = await req.json();

    if (!shares || !Array.isArray(shares)) {
      return Response.json({ error: 'Invalid shares array' }, { status: 400 });
    }

    // Group by recipient
    const recipientGroups = {};
    const originalSharers = new Set();

    for (const share of shares) {
      if (!recipientGroups[share.shared_with_email]) {
        recipientGroups[share.shared_with_email] = [];
      }
      recipientGroups[share.shared_with_email].push(share);
      
      if (share.shared_by_email && share.shared_by_email !== revoker_email) {
        originalSharers.add(share.shared_by_email);
      }
    }

    let notificationsSent = 0;

    // Notify each recipient
    for (const [recipientEmail, recipientShares] of Object.entries(recipientGroups)) {
      try {
        await base44.integrations.Core.SendEmail({
          to: recipientEmail,
          subject: `${recipientShares.length} Dokumentenzugriff(e) widerrufen`,
          body: `
Hallo,

der Zugriff auf ${recipientShares.length} geteilte(s) Dokument(e) wurde widerrufen.

Widerrufen durch: ${revoker_email}

Sie haben keinen Zugriff mehr auf diese Dokumente.

Mit freundlichen Grüßen
Ihr NK-Abrechnung Team
          `.trim()
        });
        notificationsSent++;
      } catch (error) {
        console.error(`Failed to notify ${recipientEmail}:`, error);
      }
    }

    // Notify original sharers
    for (const sharerEmail of originalSharers) {
      try {
        const sharerShares = shares.filter(s => s.shared_by_email === sharerEmail);
        await base44.integrations.Core.SendEmail({
          to: sharerEmail,
          subject: 'Dokumentenfreigaben wurden widerrufen',
          body: `
Hallo,

${sharerShares.length} von Ihnen erteilte Dokumentenfreigabe(n) wurde(n) widerrufen.

Widerrufen durch: ${revoker_email}

Mit freundlichen Grüßen
Ihr NK-Abrechnung Team
          `.trim()
        });
        notificationsSent++;
      } catch (error) {
        console.error(`Failed to notify sharer ${sharerEmail}:`, error);
      }
    }

    return Response.json({
      success: true,
      notifications_sent: notificationsSent
    });

  } catch (error) {
    console.error('Error sending bulk revoke notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});