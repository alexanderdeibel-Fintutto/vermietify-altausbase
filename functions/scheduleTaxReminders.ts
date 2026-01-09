import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch relevant deadlines and compliance items
    const [deadlines, compliance, filings] = await Promise.all([
      base44.entities.TaxDeadline.filter({ country, is_active: true }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }) || []
    ]);

    const reminders = [];
    const now = new Date();

    // Create reminders for upcoming deadlines
    for (const deadline of deadlines) {
      const deadlineDate = new Date(deadline.deadline_date);
      const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

      // Create reminders based on configured days
      const remindDays = deadline.days_before_reminder || [30, 14, 7, 3, 1];
      
      for (const day of remindDays) {
        if (daysUntil === day) {
          const reminderType = daysUntil <= 7 ? 'deadline_3_days' : 'deadline_1_week';
          
          reminders.push({
            user_email: user.email,
            country,
            tax_year: taxYear,
            reminder_type: reminderType,
            title: `⏰ ${daysUntil}d: ${deadline.title}`,
            message: `Steuerfrist "${deadline.title}" in ${daysUntil} Tagen (${deadline.deadline_date}). ${deadline.description}`,
            scheduled_date: new Date().toISOString().split('T')[0],
            related_deadline: deadline.deadline_date,
            notification_channels: ['email', 'in_app'],
            status: 'pending'
          });
        }
      }
    }

    // Create reminders for incomplete compliance items
    for (const item of compliance) {
      if (item.status === 'pending' && item.deadline) {
        const deadlineDate = new Date(item.deadline);
        const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntil > 0 && daysUntil <= 30) {
          reminders.push({
            user_email: user.email,
            country,
            tax_year: taxYear,
            reminder_type: 'calculation_needed',
            title: `📋 ${item.requirement} - ${daysUntil}d verbleibend`,
            message: `Compliance-Anforderung "${item.requirement}" ist noch nicht erfüllt. Deadline: ${item.deadline}`,
            scheduled_date: new Date().toISOString().split('T')[0],
            related_deadline: item.deadline,
            notification_channels: ['email', 'in_app'],
            status: 'pending'
          });
        }
      }
    }

    // Create reminder if filing is not submitted yet
    if (filings.length === 0 || !filings.some(f => f.status === 'submitted')) {
      reminders.push({
        user_email: user.email,
        country,
        tax_year: taxYear,
        reminder_type: 'filing_ready',
        title: '📤 Steuererklärung noch nicht eingereicht',
        message: 'Ihre Steuererklärung für ' + taxYear + ' wurde noch nicht eingereicht. Bereiten Sie alle erforderlichen Dokumente vor.',
        scheduled_date: new Date().toISOString().split('T')[0],
        notification_channels: ['email', 'in_app'],
        status: 'pending'
      });
    }

    // Create reminders for document collection if many are missing
    const requiredDocs = 15;
    const docs = await base44.entities.TaxDocument.filter({ 
      user_email: user.email, 
      country, 
      tax_year: taxYear 
    });

    if (docs.length < requiredDocs) {
      reminders.push({
        user_email: user.email,
        country,
        tax_year: taxYear,
        reminder_type: 'document_collection_start',
        title: `📄 Dokumentensammlung (${docs.length}/${requiredDocs})`,
        message: `Sie haben ${docs.length} von ${requiredDocs} erforderlichen Steuerdokumenten hochgeladen. Sammeln Sie noch ${requiredDocs - docs.length} Dokumente.`,
        scheduled_date: new Date().toISOString().split('T')[0],
        notification_channels: ['email', 'in_app'],
        status: 'pending'
      });
    }

    // Save reminders to database
    let created = 0;
    for (const reminder of reminders) {
      try {
        await base44.entities.TaxReminder.create(reminder);
        created++;
      } catch (error) {
        console.error('Error creating reminder:', error);
      }
    }

    return Response.json({
      status: 'success',
      reminders_created: created,
      total_reminders: reminders.length,
      reminders: reminders
    });
  } catch (error) {
    console.error('Schedule reminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});