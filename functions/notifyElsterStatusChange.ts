import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { submission_id, new_status } = await req.json();

    console.log('[NOTIFY] Status changed to:', new_status);

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions?.length) return Response.json({ success: false });

    const submission = submissions[0];

    // Finde User der Submission erstellt hat
    const users = await base44.asServiceRole.entities.User.filter({
      id: submission.created_by
    });

    if (users?.length > 0) {
      const user = users[0];
      const statusMessages = {
        'ACCEPTED': '✅ Ihre Einreichung wurde von ELSTER akzeptiert!',
        'REJECTED': '❌ Ihre Einreichung wurde abgelehnt. Bitte überprüfen Sie die Fehler.',
        'SUBMITTED': '📤 Ihre Einreichung wurde übermittelt.'
      };

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `ELSTER Status-Update: ${submission.tax_form_type}`,
        body: `
          <h2>Statusänderung</h2>
          <p>Hallo ${user.full_name || user.email},</p>
          <p>${statusMessages[new_status] || `Status: ${new_status}`}</p>
          <p><strong>Formular:</strong> ${submission.tax_form_type} ${submission.tax_year}</p>
          <p>Bitte melden Sie sich an um Details zu sehen.</p>
        `
      });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});