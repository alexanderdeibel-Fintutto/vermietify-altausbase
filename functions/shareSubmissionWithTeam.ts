import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, user_emails = [], access_level = 'view' } = await req.json();

    console.log('[SHARING] Sharing submission', submission_id, 'with', user_emails.length, 'users');

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions?.length) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];
    const shared = [];

    for (const email of user_emails) {
      try {
        // Notifikation senden
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Steuerformular ${submission.tax_form_type} wurde mit Ihnen geteilt`,
          body: `
            <h2>Einreichung geteilt</h2>
            <p>Hallo,</p>
            <p>${user.full_name || user.email} hat die Einreichung "${submission.tax_form_type} ${submission.tax_year}" mit Ihnen geteilt.</p>
            <p><strong>Zugriff:</strong> ${access_level === 'edit' ? 'Bearbeiten' : 'Ansicht'}</p>
            <p>Bitte melden Sie sich an, um die Details zu sehen.</p>
          `
        });

        shared.push({ email, status: 'shared' });
      } catch (error) {
        shared.push({ email, status: 'failed', error: error.message });
      }
    }

    return Response.json({ 
      success: true, 
      shared_with: shared,
      access_level
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});