import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Define reminder schedules for each country
    const reminderSchedules = {
      AT: [
        {
          reminder_type: 'document_collection_start',
          title: 'Dokumentensammlung starten',
          message: 'Beginnen Sie mit der Sammlung Ihrer Steuerdokumente für das Jahr ' + taxYear,
          days_offset: -60,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'calculation_needed',
          title: 'Steuerberechnung durchführen',
          message: 'Es ist Zeit, Ihre Steuern für ' + taxYear + ' zu berechnen',
          days_offset: -30,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'filing_ready',
          title: 'Einreichung vorbereiten',
          message: 'Bereiten Sie Ihre Steuererklärung zur Einreichung vor',
          days_offset: -14,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'deadline_1_week',
          title: 'Steuererklärung in 7 Tagen fällig',
          message: 'Einreichungsdeadline für Steuererklärung in 7 Tagen',
          days_offset: -7,
          channels: ['email', 'push', 'in_app']
        },
        {
          reminder_type: 'deadline_3_days',
          title: 'Steuererklärung in 3 Tagen fällig',
          message: 'Dringende Erinnerung: Einreichungsdeadline in 3 Tagen',
          days_offset: -3,
          channels: ['email', 'push', 'in_app']
        },
        {
          reminder_type: 'deadline_1_day',
          title: 'Steuererklärung morgen fällig!',
          message: 'KRITISCH: Einreichungsdeadline MORGEN',
          days_offset: -1,
          channels: ['email', 'push', 'in_app']
        }
      ],
      CH: [
        {
          reminder_type: 'document_collection_start',
          title: 'Dokumentensammlung starten',
          message: 'Sammeln Sie Ihre Steuerdokumente für die Steuererklärung ' + taxYear,
          days_offset: -90,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'calculation_needed',
          title: 'Steuerberechnung durchführen',
          message: 'Führen Sie Ihre Steuerberechnung für Bund und Kanton durch',
          days_offset: -45,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'filing_ready',
          title: 'Einreichung vorbereiten (Bund)',
          message: 'Bereiten Sie Ihre Bundessteuererklärung zur Einreichung vor',
          days_offset: -30,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'deadline_1_week',
          title: 'Bundessteuererklärung in 7 Tagen fällig',
          message: 'Deadline für Bundessteuererklärung in einer Woche',
          days_offset: -7,
          channels: ['email', 'push', 'in_app']
        },
        {
          reminder_type: 'deadline_3_days',
          title: 'Frist in 3 Tagen',
          message: 'Nur noch 3 Tage bis zur Einreichungsdeadline',
          days_offset: -3,
          channels: ['email', 'push', 'in_app']
        }
      ],
      DE: [
        {
          reminder_type: 'document_collection_start',
          title: 'Dokumentensammlung starten',
          message: 'Sammeln Sie Ihre Belege für die Steuererklärung ' + taxYear,
          days_offset: -90,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'calculation_needed',
          title: 'Steuerberechnung durchführen',
          message: 'Führen Sie Ihre Einkommensteuerberechnung durch',
          days_offset: -60,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'filing_ready',
          title: 'Steuererklärung einreichen',
          message: 'Ihre Steuererklärung ist bereit für die ELSTER-Einreichung',
          days_offset: -30,
          channels: ['email', 'in_app']
        },
        {
          reminder_type: 'deadline_1_week',
          title: 'Steuererklärung in 7 Tagen fällig',
          message: 'Einreichungsdeadline für Einkommensteuer in 7 Tagen',
          days_offset: -7,
          channels: ['email', 'push', 'in_app']
        },
        {
          reminder_type: 'deadline_3_days',
          title: 'Nur noch 3 Tage!',
          message: 'Dringende Erinnerung: Nur noch 3 Tage bis Einreichungsdeadline',
          days_offset: -3,
          channels: ['email', 'push', 'in_app']
        },
        {
          reminder_type: 'deadline_1_day',
          title: 'Steuererklärung MORGEN fällig!',
          message: 'KRITISCH: Deadline MORGEN - Bitte sofort einreichen',
          days_offset: -1,
          channels: ['email', 'push', 'in_app']
        },
        {
          reminder_type: 'annual_review',
          title: 'Jahresabschluss & Planung',
          message: 'Planen Sie Ihre Steuerstrategie für nächstes Jahr',
          days_offset: 60,
          channels: ['email', 'in_app']
        }
      ]
    };

    // Get deadline for the country
    const deadlines = {
      AT: new Date(taxYear + 1, 4, 31), // May 31
      CH: new Date(taxYear + 1, 2, 14), // March 14 (federal)
      DE: new Date(taxYear + 1, 4, 30) // May 30 (extended) / Jul 31 (with advisor)
    };

    const deadline = deadlines[country];
    const schedules = reminderSchedules[country] || [];
    let createdCount = 0;
    let errorCount = 0;

    // Get all users in the country (simplified - in production would be more selective)
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);

    for (const schedule of schedules) {
      const scheduledDate = new Date(deadline);
      scheduledDate.setDate(scheduledDate.getDate() + schedule.days_offset);

      for (const u of users) {
        try {
          await base44.asServiceRole.entities.TaxReminder.create({
            user_email: u.email,
            country,
            tax_year: taxYear,
            reminder_type: schedule.reminder_type,
            title: schedule.title,
            message: schedule.message,
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            related_deadline: deadline.toISOString().split('T')[0],
            notification_channels: schedule.channels,
            status: 'pending'
          });
          createdCount++;
        } catch (error) {
          console.error(`Error creating reminder for ${u.email}:`, error);
          errorCount++;
        }
      }
    }

    return Response.json({
      status: 'success',
      country,
      tax_year: taxYear,
      reminders_created: createdCount,
      errors: errorCount,
      message: `Successfully scheduled ${createdCount} reminders`
    });
  } catch (error) {
    console.error('Reminder scheduling error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});