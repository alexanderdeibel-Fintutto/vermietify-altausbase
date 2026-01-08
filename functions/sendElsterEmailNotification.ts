import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { submission_id, event_type } = await req.json();

    console.log(`[EMAIL] Notification for submission ${submission_id}, event: ${event_type}`);

    const submission = await base44.asServiceRole.entities.ElsterSubmission.filter({ 
      id: submission_id 
    });

    if (!submission || submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // User-Daten holen
    const users = await base44.asServiceRole.entities.User.filter({ 
      email: sub.created_by 
    });

    if (!users || users.length === 0) {
      console.log('[SKIP] User not found');
      return Response.json({ success: true, sent: false });
    }

    const user = users[0];

    const emailTemplates = {
      'validated': {
        subject: `✅ ELSTER-Formular validiert: ${sub.tax_form_type} ${sub.tax_year}`,
        body: `
Hallo ${user.full_name || user.email},

Ihr ELSTER-Formular wurde erfolgreich validiert:

📋 Formular: ${sub.tax_form_type}
📅 Steuerjahr: ${sub.tax_year}
⚖️ Rechtsform: ${sub.legal_form}
✅ Status: VALIDIERT

Das Formular ist jetzt bereit zur Übermittlung an das Finanzamt.

Sie können es jetzt in der ELSTER-Integration übermitteln:
${Deno.env.get('APP_URL') || 'https://app.base44.com'}/ElsterIntegration

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
        `
      },
      'accepted': {
        subject: `🎉 ELSTER-Übermittlung erfolgreich: ${sub.tax_form_type} ${sub.tax_year}`,
        body: `
Hallo ${user.full_name || user.email},

Ihre ELSTER-Übermittlung wurde vom Finanzamt akzeptiert!

📋 Formular: ${sub.tax_form_type}
📅 Steuerjahr: ${sub.tax_year}
✅ Status: AKZEPTIERT
${sub.transfer_ticket ? `🎫 Transfer-Ticket: ${sub.transfer_ticket}` : ''}

Die Steuererklärung wurde erfolgreich beim Finanzamt eingereicht.

Details anzeigen:
${Deno.env.get('APP_URL') || 'https://app.base44.com'}/ElsterIntegration

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
        `
      },
      'rejected': {
        subject: `❌ ELSTER-Übermittlung abgelehnt: ${sub.tax_form_type} ${sub.tax_year}`,
        body: `
Hallo ${user.full_name || user.email},

Ihre ELSTER-Übermittlung wurde leider abgelehnt.

📋 Formular: ${sub.tax_form_type}
📅 Steuerjahr: ${sub.tax_year}
❌ Status: ABGELEHNT

Bitte prüfen Sie die Validierungsfehler und übermitteln Sie das Formular erneut.

Details anzeigen:
${Deno.env.get('APP_URL') || 'https://app.base44.com'}/ElsterIntegration

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
        `
      }
    };

    const template = emailTemplates[event_type];
    if (!template) {
      console.log('[SKIP] No template for event:', event_type);
      return Response.json({ success: true, sent: false });
    }

    await base44.integrations.Core.SendEmail({
      to: user.email,
      from_name: 'ImmoVerwalter ELSTER',
      subject: template.subject,
      body: template.body
    });

    console.log('[SUCCESS] Email sent to', user.email);

    return Response.json({
      success: true,
      sent: true,
      recipient: user.email
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});