import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, submission_id, recipient_email, custom_message } = await req.json();

    if (!type || !submission_id) {
      return Response.json({ error: 'type and submission_id required' }, { status: 400 });
    }

    console.log(`[NOTIFICATION] Sending ${type} notification for ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const recipientEmail = recipient_email || user.email;

    const templates = {
      validation_passed: {
        subject: `✅ ELSTER-Validierung erfolgreich - ${sub.tax_form_type}`,
        body: `Ihre ELSTER-Submission wurde erfolgreich validiert.\n\nFormular: ${sub.tax_form_type}\nJahr: ${sub.tax_year}\nStatus: ${sub.status}\n\nSie können die Submission nun übermitteln.`
      },
      validation_failed: {
        subject: `⚠️ ELSTER-Validierung fehlgeschlagen - ${sub.tax_form_type}`,
        body: `Ihre ELSTER-Submission enthält Fehler.\n\nFormular: ${sub.tax_form_type}\nJahr: ${sub.tax_year}\nFehler: ${sub.validation_errors?.length || 0}\n\nBitte überprüfen Sie die Daten.`
      },
      submission_success: {
        subject: `🎉 ELSTER-Übermittlung erfolgreich - ${sub.tax_form_type}`,
        body: `Ihre ELSTER-Submission wurde erfolgreich übermittelt.\n\nFormular: ${sub.tax_form_type}\nJahr: ${sub.tax_year}\nTransfer-Ticket: ${sub.transfer_ticket || 'N/A'}\n\nSie erhalten in Kürze eine Bestätigung vom Finanzamt.`
      },
      submission_failed: {
        subject: `❌ ELSTER-Übermittlung fehlgeschlagen - ${sub.tax_form_type}`,
        body: `Die Übermittlung Ihrer ELSTER-Submission ist fehlgeschlagen.\n\nFormular: ${sub.tax_form_type}\nJahr: ${sub.tax_year}\n\nBitte prüfen Sie die Fehlermeldungen und versuchen Sie es erneut.`
      },
      deadline_reminder: {
        subject: `⏰ ELSTER-Frist-Erinnerung - ${sub.tax_form_type}`,
        body: `Erinnerung: Die Abgabefrist für Ihre ELSTER-Submission rückt näher.\n\nFormular: ${sub.tax_form_type}\nJahr: ${sub.tax_year}\nStatus: ${sub.status}\n\nBitte vervollständigen Sie die Submission zeitnah.`
      },
      custom: {
        subject: `ELSTER-Benachrichtigung - ${sub.tax_form_type}`,
        body: custom_message || 'Neue Benachrichtigung zu Ihrer ELSTER-Submission.'
      }
    };

    const template = templates[type] || templates.custom;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'ELSTER-System',
      to: recipientEmail,
      subject: template.subject,
      body: template.body
    });

    // Log
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'notification_sent',
      user_id: user.id,
      metadata: {
        notification_type: type,
        recipient: recipientEmail,
        sent_at: new Date().toISOString()
      }
    });

    console.log(`[NOTIFICATION] Sent successfully to ${recipientEmail}`);

    return Response.json({
      success: true,
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});