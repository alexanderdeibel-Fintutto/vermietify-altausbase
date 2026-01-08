import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { alert_type, severity, message, submission_ids } = await req.json();

    console.log(`[COMPLIANCE-ALERT] ${severity}: ${alert_type}`);

    // Hole alle Admin-User
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === 'admin');

    let sentCount = 0;

    for (const admin of admins) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `🚨 ELSTER Compliance Alert: ${alert_type}`,
          body: `
            <h2>Compliance-Warnung</h2>
            <p><strong>Typ:</strong> ${alert_type}</p>
            <p><strong>Schweregrad:</strong> ${severity}</p>
            <p><strong>Nachricht:</strong> ${message}</p>
            ${submission_ids ? `<p><strong>Betroffene Submissions:</strong> ${submission_ids.length}</p>` : ''}
            <p>Bitte prüfen Sie die ELSTER-Integration und beheben Sie die Probleme.</p>
          `
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${admin.email}:`, error);
      }
    }

    console.log(`[COMPLIANCE-ALERT] Sent to ${sentCount} admins`);

    return Response.json({
      success: true,
      recipients: sentCount
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});