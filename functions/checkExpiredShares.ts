import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all shares with expiry dates that have passed
    const now = new Date().toISOString();
    const allShares = await base44.asServiceRole.entities.DocumentPermission.list();
    
    const expiredShares = allShares.filter(share => 
      share.expires_at && new Date(share.expires_at) < new Date()
    );

    let revokedCount = 0;
    let notificationsSent = 0;

    // Delete expired shares and notify
    for (const share of expiredShares) {
      try {
        await base44.asServiceRole.entities.DocumentPermission.delete(share.id);
        revokedCount++;

        // Notify recipient
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: share.shared_with_email,
            subject: 'Dokumentenzugriff ist abgelaufen',
            body: `
Hallo,

Ihr Zugriff auf ein geteiltes Dokument ist abgelaufen.

Die Freigabe wurde automatisch am ${new Date(share.expires_at).toLocaleDateString('de-DE')} beendet.

Mit freundlichen Grüßen
Ihr NK-Abrechnung Team
            `.trim()
          });
          notificationsSent++;
        } catch (emailError) {
          console.error('Failed to notify recipient:', emailError);
        }

      } catch (error) {
        console.error(`Failed to revoke expired share ${share.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      expired_shares_found: expiredShares.length,
      revoked: revokedCount,
      notifications_sent: notificationsSent
    });

  } catch (error) {
    console.error('Error checking expired shares:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});