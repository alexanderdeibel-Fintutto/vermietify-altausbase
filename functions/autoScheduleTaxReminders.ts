import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Steuerprofil laden
    const profiles = await base44.entities.TaxProfile.filter({
      user_email: user.email
    }, '-updated_date', 1);

    if (!profiles.length) {
      return Response.json({ error: 'Steuerprofil nicht gefunden' }, { status: 404 });
    }

    const profile = profiles[0];
    const currentYear = new Date().getFullYear();
    const reminders = [];

    // Länder-spezifische Deadlines
    const countryDeadlines = {
      'CH': {
        deadline_month: 3,
        deadline_day: 15,
        days_before: [60, 30, 14, 7, 3, 1]
      },
      'DE': {
        deadline_month: 5,
        deadline_day: 31,
        days_before: [60, 30, 14, 7, 3, 1],
        extension_month: 8,
        extension_day: 31
      },
      'AT': {
        deadline_month: 6,
        deadline_day: 2,
        days_before: [60, 30, 14, 7, 3, 1],
        extension_month: 8,
        extension_day: 31
      }
    };

    // Pro Jurisdiction Reminders erstellen
    for (const jurisdiction of profile.tax_jurisdictions) {
      const config = countryDeadlines[jurisdiction];
      if (!config) continue;

      // Hauptfrist
      const deadline = new Date(currentYear, config.deadline_month - 1, config.deadline_day);
      
      for (const daysBefore of config.days_before) {
        const reminderDate = new Date(deadline);
        reminderDate.setDate(reminderDate.getDate() - daysBefore);

        if (reminderDate > new Date()) {
          reminders.push({
            user_email: user.email,
            country: jurisdiction,
            reminder_type: `deadline_${daysBefore}_days`,
            title: `${jurisdiction} Steuererklärung - ${daysBefore} Tage`,
            message: `Frist für Steuererklärung ${jurisdiction} in ${daysBefore} Tagen: ${deadline.toLocaleDateString('de-DE')}`,
            scheduled_date: reminderDate.toISOString().split('T')[0],
            related_deadline: deadline.toISOString().split('T')[0],
            notification_channels: ['email', 'in_app'],
            status: 'pending'
          });
        }
      }

      // Verlängerungsfrist
      if (config.extension_month) {
        const extensionDeadline = new Date(currentYear, config.extension_month - 1, config.extension_day);
        reminders.push({
          user_email: user.email,
          country: jurisdiction,
          reminder_type: 'extension_deadline',
          title: `${jurisdiction} Verlängerungsfrist`,
          message: `Verlängerungsfrist für ${jurisdiction} Steuererklärung: ${extensionDeadline.toLocaleDateString('de-DE')}`,
          scheduled_date: new Date(extensionDeadline.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          related_deadline: extensionDeadline.toISOString().split('T')[0],
          notification_channels: ['email'],
          status: 'pending'
        });
      }
    }

    // Quartalsvorauszahlungen für komplexe Profile
    if (profile.number_of_companies > 0 || profile.has_crypto_assets) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterDate = new Date(currentYear, quarter * 3 - 1, 15);
        reminders.push({
          user_email: user.email,
          country: 'DE',
          reminder_type: 'quarterly_payment',
          title: `Q${quarter} Vorauszahlung`,
          message: `Quartalsvorauszahlung Q${quarter} fällig`,
          scheduled_date: new Date(quarterDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          related_deadline: quarterDate.toISOString().split('T')[0],
          notification_channels: ['email'],
          status: 'pending'
        });
      }
    }

    // Reminders speichern
    if (reminders.length > 0) {
      await base44.asServiceRole.entities.TaxReminder.bulkCreate(reminders);
    }

    return Response.json({
      user_email: user.email,
      reminders_scheduled: reminders.length,
      jurisdictions: profile.tax_jurisdictions,
      profile_type: profile.profile_type,
      reminders: reminders
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});