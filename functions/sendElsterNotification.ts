import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { user_email, notification_type, submission_id, data } = await req.json();

    if (!user_email || !notification_type) {
      return Response.json({ error: 'user_email and notification_type required' }, { status: 400 });
    }

    console.log(`[NOTIFICATION] Sending ${notification_type} to ${user_email}`);

    const notificationTemplates = {
      SUBMISSION_ACCEPTED: {
        subject: '✅ ELSTER-Submission erfolgreich akzeptiert',
        body: (data) => `
Gute Nachrichten!

Ihre ELSTER-Submission wurde erfolgreich vom Finanzamt akzeptiert:

📋 Formular: ${data.form_type}
📅 Steuerjahr: ${data.tax_year}
🎫 Transfer-Ticket: ${data.transfer_ticket}

Die Submission ist nun archiviert und 10 Jahre GoBD-konform aufbewahrt.

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
        `.trim()
      },
      SUBMISSION_REJECTED: {
        subject: '❌ ELSTER-Submission abgelehnt',
        body: (data) => `
Ihre ELSTER-Submission wurde leider abgelehnt:

📋 Formular: ${data.form_type}
📅 Steuerjahr: ${data.tax_year}
❌ Grund: ${data.error_message || 'Siehe ELSTER-Antwort'}

Bitte überprüfen Sie die Daten und reichen Sie die Submission erneut ein.

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
        `.trim()
      },
      VALIDATION_FAILED: {
        subject: '⚠️ Validierung fehlgeschlagen',
        body: (data) => `
Die Validierung Ihrer ELSTER-Submission ist fehlgeschlagen:

📋 Formular: ${data.form_type}
📅 Steuerjahr: ${data.tax_year}
🔍 Fehler: ${data.error_count} Fehler gefunden

Bitte korrigieren Sie die Fehler und validieren Sie erneut.

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
        `.trim()
      },
      CERTIFICATE_EXPIRING: {
        subject: '⏰ ELSTER-Zertifikat läuft bald ab',
        body: (data) => `
Ihr ELSTER-Zertifikat läuft bald ab:

📜 Zertifikat: ${data.certificate_name}
📅 Gültig bis: ${new Date(data.valid_until).toLocaleDateString('de-DE')}
⏰ Verbleibend: ${data.days_remaining} Tage

Bitte laden Sie rechtzeitig ein neues Zertifikat hoch.

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
        `.trim()
      },
      DEADLINE_REMINDER: {
        subject: '📅 Erinnerung: Steuer-Frist',
        body: (data) => `
Erinnerung an folgende Steuerfrist:

📋 ${data.description}
📅 Frist: ${new Date(data.deadline).toLocaleDateString('de-DE')}
⏰ Verbleibend: ${data.days_until} Tage

${data.days_until <= 7 ? '⚠️ WICHTIG: Die Frist läuft bald ab!' : ''}

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
        `.trim()
      }
    };

    const template = notificationTemplates[notification_type];
    if (!template) {
      return Response.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    // Sende E-Mail
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user_email,
      from_name: 'ImmoVerwalter ELSTER',
      subject: template.subject,
      body: template.body(data || {})
    });

    // Erstelle In-App Notification
    await base44.asServiceRole.entities.Notification.create({
      user_email,
      title: template.subject,
      message: template.body(data || {}),
      type: 'elster',
      priority: ['SUBMISSION_REJECTED', 'VALIDATION_FAILED', 'CERTIFICATE_EXPIRING'].includes(notification_type) ? 'high' : 'normal',
      link: submission_id ? `/elster/${submission_id}` : '/elster',
      metadata: {
        notification_type,
        submission_id,
        ...data
      }
    });

    console.log('[SUCCESS] Notification sent');

    return Response.json({
      success: true,
      notification_type
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});