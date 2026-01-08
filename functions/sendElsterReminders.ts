import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[REMINDERS] Checking for upcoming tax deadlines');

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Definiere wichtige Steuerfristen
    const deadlines = [
      { month: 5, day: 31, form: 'EST', description: 'Einkommensteuererklärung' },
      { month: 7, day: 31, form: 'GEWERBESTEUER', description: 'Gewerbesteuererklärung' },
      { month: 7, day: 31, form: 'UMSATZSTEUER', description: 'Umsatzsteuererklärung (Jahreserklärung)' }
    ];

    // Prüfe welche Fristen in den nächsten 30 Tagen anstehen
    const upcomingDeadlines = deadlines.filter(deadline => {
      const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
      const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    });

    if (upcomingDeadlines.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'Keine anstehenden Fristen in den nächsten 30 Tagen'
      });
    }

    // Alle Admin-User finden
    const allUsers = await base44.asServiceRole.entities.User.list();
    const adminUsers = allUsers.filter(u => u.role === 'admin');

    let sent = 0;
    for (const user of adminUsers) {
      for (const deadline of upcomingDeadlines) {
        const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
        const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));

        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `⏰ Steuer-Erinnerung: ${deadline.description} - noch ${daysUntil} Tage`,
          body: `
            <h2>Steuer-Frist-Erinnerung</h2>
            <p>Hallo ${user.full_name || user.email},</p>
            <p>Dies ist eine automatische Erinnerung für die anstehende Steuerfrist:</p>
            <div style="padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">${deadline.description}</h3>
              <p style="margin: 0; font-size: 18px;"><strong>Frist: ${deadline.day}.${deadline.month}.${currentYear}</strong></p>
              <p style="margin: 5px 0 0 0;">⏰ Noch <strong>${daysUntil} Tage</strong></p>
            </div>
            <p>Bitte stellen Sie sicher, dass alle erforderlichen Formulare rechtzeitig übermittelt werden.</p>
            <p>Mit freundlichen Grüßen,<br>Ihr ELSTER-Integration Team</p>
          `
        });
        sent++;
      }
    }

    return Response.json({ 
      success: true, 
      reminders_sent: sent,
      deadlines: upcomingDeadlines
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});