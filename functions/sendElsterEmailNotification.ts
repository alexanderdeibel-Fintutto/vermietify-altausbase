import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, notification_type, recipient_email } = await req.json();

    if (!submission_id || !notification_type) {
      return Response.json({ error: 'submission_id and notification_type required' }, { status: 400 });
    }

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({ id: submission_id });
    if (submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];
    const recipientEmail = recipient_email || user.email;

    let subject = '';
    let body = '';

    switch (notification_type) {
      case 'submission_accepted':
        subject = `✅ ELSTER ${submission.tax_form_type} akzeptiert`;
        body = `
Gute Nachrichten!

Ihre ${submission.tax_form_type} für das Jahr ${submission.tax_year} wurde von ELSTER akzeptiert.

Transfer-Ticket: ${submission.transfer_ticket || 'N/A'}
Status: ${submission.status}

Mit freundlichen Grüßen,
Ihr ELSTER-System
        `;
        break;

      case 'submission_rejected':
        subject = `❌ ELSTER ${submission.tax_form_type} abgelehnt`;
        body = `
Ihre ${submission.tax_form_type} für das Jahr ${submission.tax_year} wurde abgelehnt.

Bitte prüfen Sie die Fehler und reichen Sie erneut ein.

Status: ${submission.status}
Fehler: ${submission.validation_errors?.length || 0}

Mit freundlichen Grüßen,
Ihr ELSTER-System
        `;
        break;

      case 'deadline_reminder':
        subject = `⏰ Erinnerung: ELSTER-Frist für ${submission.tax_form_type}`;
        body = `
Erinnerung: Die Frist für Ihre ${submission.tax_form_type} (Jahr ${submission.tax_year}) nähert sich.

Aktueller Status: ${submission.status}

Bitte stellen Sie sicher, dass Sie rechtzeitig einreichen.

Mit freundlichen Grüßen,
Ihr ELSTER-System
        `;
        break;

      case 'validation_failed':
        subject = `⚠️ Validierung fehlgeschlagen: ${submission.tax_form_type}`;
        body = `
Die Validierung Ihrer ${submission.tax_form_type} (Jahr ${submission.tax_year}) ist fehlgeschlagen.

Fehleranzahl: ${submission.validation_errors?.length || 0}
Warnungen: ${submission.validation_warnings?.length || 0}

Bitte beheben Sie die Fehler vor der Einreichung.

Mit freundlichen Grüßen,
Ihr ELSTER-System
        `;
        break;

      default:
        subject = `ELSTER-Benachrichtigung: ${submission.tax_form_type}`;
        body = `Status-Update für Ihre ${submission.tax_form_type} (Jahr ${submission.tax_year}).`;
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'ELSTER-System',
      to: recipientEmail,
      subject,
      body
    });

    console.log(`[EMAIL] Sent ${notification_type} to ${recipientEmail}`);

    return Response.json({
      success: true,
      message: 'Email gesendet'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});