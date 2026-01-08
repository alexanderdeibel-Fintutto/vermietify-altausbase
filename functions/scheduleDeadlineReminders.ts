import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[DEADLINE REMINDERS] Starting deadline check');

    // Hole alle User
    const users = await base44.asServiceRole.entities.User.list();
    
    // Definiere Tax Deadlines
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const deadlines = [
      { month: 1, day: 10, form: 'Umsatzsteuer-Voranmeldung', description: 'Dezember Voranmeldung', days_before: [7, 3, 1] },
      { month: 2, day: 28, form: 'Jahreserklärung', description: 'Vorjahr ohne Berater', days_before: [30, 14, 7] },
      { month: 5, day: 31, form: 'Gewerbesteuer', description: 'Vorauszahlung Q2', days_before: [14, 7] },
      { month: 7, day: 31, form: 'Einkommensteuererklärung', description: 'Vorjahr ohne Berater', days_before: [30, 14, 7] },
      { month: 12, day: 31, form: 'Jahresabschluss', description: 'Dokumentation vervollständigen', days_before: [30, 14] }
    ];

    const reminders = [];

    for (const user of users) {
      // Hole Submissions des Users
      const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
        created_by: user.email
      });

      for (const deadline of deadlines) {
        const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
        const daysUntil = Math.floor((deadlineDate - now) / (1000 * 60 * 60 * 24));

        // Check if reminder should be sent
        if (deadline.days_before.includes(daysUntil)) {
          // Check if submission already exists
          const hasSubmission = submissions.some(s => 
            s.tax_year === (deadline.month <= 7 ? currentYear - 1 : currentYear) &&
            s.status !== 'DRAFT'
          );

          if (!hasSubmission) {
            // Send reminder
            await base44.asServiceRole.functions.invoke('sendElsterNotification', {
              user_email: user.email,
              notification_type: 'DEADLINE_REMINDER',
              data: {
                description: `${deadline.form}: ${deadline.description}`,
                deadline: deadlineDate.toISOString(),
                days_until: daysUntil
              }
            });

            reminders.push({
              user: user.email,
              deadline: deadline.form,
              days_until: daysUntil
            });

            console.log(`[REMINDER] Sent to ${user.email} for ${deadline.form} (${daysUntil} days)`);
          }
        }
      }

      // Check Certificate Expiration
      const certificates = await base44.asServiceRole.entities.ElsterCertificate.filter({
        created_by: user.email,
        is_active: true
      });

      for (const cert of certificates) {
        const validUntil = new Date(cert.valid_until);
        const daysUntilExpiry = Math.floor((validUntil - now) / (1000 * 60 * 60 * 24));

        if ([60, 30, 14, 7].includes(daysUntilExpiry)) {
          await base44.asServiceRole.functions.invoke('sendElsterNotification', {
            user_email: user.email,
            notification_type: 'CERTIFICATE_EXPIRING',
            data: {
              certificate_name: cert.certificate_name,
              valid_until: cert.valid_until,
              days_remaining: daysUntilExpiry
            }
          });

          reminders.push({
            user: user.email,
            type: 'certificate_expiry',
            days_until: daysUntilExpiry
          });

          console.log(`[REMINDER] Certificate expiring for ${user.email} (${daysUntilExpiry} days)`);
        }
      }
    }

    console.log(`[SUCCESS] Sent ${reminders.length} reminders`);

    return Response.json({
      success: true,
      reminders_sent: reminders.length,
      details: reminders
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});