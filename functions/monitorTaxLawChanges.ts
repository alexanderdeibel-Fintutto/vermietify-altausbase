import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('Monitoring tax law changes...');

    // Fetch recent law updates
    const recentUpdates = await base44.entities.TaxLawUpdate.filter(
      { is_active: true },
      '-published_date',
      50
    ) || [];

    // Find updates that need notifications
    const updatesToNotify = recentUpdates.filter(
      u => !u.notification_sent && new Date(u.effective_date) > new Date()
    );

    console.log(`Found ${updatesToNotify.length} updates to notify`);

    // Send notifications and mark as sent
    for (const update of updatesToNotify) {
      try {
        // Get affected users
        const allUsers = await base44.entities.User.list('-created_date', 1000) || [];
        const relevantUsers = allUsers.filter(u => {
          if (update.country === 'AT' && u.preferred_countries?.includes('AT')) return true;
          if (update.country === 'CH' && u.preferred_countries?.includes('CH')) return true;
          if (update.country === 'DE' && u.preferred_countries?.includes('DE')) return true;
          return false;
        });

        console.log(`Notifying ${relevantUsers.length} users about ${update.title}`);

        // Send notification email
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `⚠️ Steuergesetz-Änderung: ${update.title}`,
          body: `
            <h2>${update.title}</h2>
            <p><strong>Land:</strong> ${update.country}</p>
            <p><strong>Gültig ab:</strong> ${update.effective_date}</p>
            <p><strong>Auswirkungsgrad:</strong> ${update.impact_level}</p>
            <p><strong>Beschreibung:</strong></p>
            <p>${update.description}</p>
            <p><a href="${update.source_url}">Zur offiziellen Quelle</a></p>
          `
        });

        // Mark as notified
        await base44.asServiceRole.entities.TaxLawUpdate.update(update.id, {
          notification_sent: true
        });
      } catch (error) {
        console.error(`Error notifying for update ${update.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      monitored: recentUpdates.length,
      notified: updatesToNotify.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Monitoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});