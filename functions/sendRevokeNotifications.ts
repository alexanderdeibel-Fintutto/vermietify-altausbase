import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shared_with_email, shared_by_email, document_id, revoker_email } = await req.json();

    // Notify recipient that access was revoked
    try {
      await base44.integrations.Core.SendEmail({
        to: shared_with_email,
        subject: 'Dokumentenzugriff widerrufen',
        body: `
Hallo,

der Zugriff auf ein geteiltes Dokument wurde widerrufen.

Widerrufen durch: ${revoker_email}

Sie haben keinen Zugriff mehr auf dieses Dokument.

Mit freundlichen Grüßen
Ihr NK-Abrechnung Team
        `.trim()
      });
    } catch (error) {
      console.error('Failed to notify recipient:', error);
    }

    // Notify original sharer if they didn't revoke it themselves
    if (shared_by_email && shared_by_email !== revoker_email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: shared_by_email,
          subject: 'Dokumentenfreigabe wurde widerrufen',
          body: `
Hallo,

eine von Ihnen erteilte Dokumentenfreigabe wurde widerrufen.

Empfänger: ${shared_with_email}
Widerrufen durch: ${revoker_email}

Mit freundlichen Grüßen
Ihr NK-Abrechnung Team
          `.trim()
        });
      } catch (error) {
        console.error('Failed to notify original sharer:', error);
      }
    }

    return Response.json({
      success: true,
      notifications_sent: 2
    });

  } catch (error) {
    console.error('Error sending revoke notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});