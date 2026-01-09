import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This can be called by scheduled task (no user context required) or admin
    const user = await base44.auth.me();
    if (user && user.role !== 'admin' && req.method !== 'POST') {
      // Allow scheduled task execution without auth
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const deadlines = await base44.entities.TaxDeadline.filter({}) || [];

    let remindersSent = 0;
    let errors = [];

    for (const deadline of deadlines) {
      try {
        const deadlineDate = new Date(deadline.deadline_date);
        const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        
        // Send reminder X days before deadline
        if (daysUntil === deadline.reminder_days_before && !deadline.reminder_sent) {
          const message = `
📋 Steuer-Erinnerung: ${deadline.title}

Land: ${deadline.country}
Steuerjahr: ${deadline.tax_year}
Fällig am: ${deadlineDate.toLocaleDateString('de-DE')}
Art: ${deadline.deadline_type === 'submission' ? 'Einreichung' : 'Zahlung'}

Beschreibung: ${deadline.description}

⏰ Diese Frist ist in ${daysUntil} Tagen fällig!

Bitte bereiten Sie alle erforderlichen Unterlagen vor.
          `.trim();

          // Send email notification
          await base44.integrations.Core.SendEmail({
            to: user?.email || 'admin@example.com',
            subject: `Steuer-Erinnerung ${deadline.country}: ${deadline.title}`,
            body: message
          });

          // Mark as reminder sent
          await base44.entities.TaxDeadline.update(deadline.id, {
            reminder_sent: true
          });

          remindersSent++;
        }
      } catch (error) {
        errors.push(`${deadline.country} - ${deadline.title}: ${error.message}`);
      }
    }

    return Response.json({
      status: 'success',
      reminders_sent: remindersSent,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Tax deadline reminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});