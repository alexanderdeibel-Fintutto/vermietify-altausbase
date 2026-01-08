import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, user_emails, permission_level, message } = await req.json();

    console.log(`[SHARE] Sharing submission ${submission_id} with ${user_emails.length} users`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submission || submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const shared = [];

    for (const email of user_emails) {
      // Sende Benachrichtigung
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `${user.full_name || user.email} hat eine ELSTER-Submission mit Ihnen geteilt`,
        body: `
          <h2>Geteilte ELSTER-Submission</h2>
          <p>${user.full_name || user.email} hat folgende Submission mit Ihnen geteilt:</p>
          <ul>
            <li>Formular: ${submission[0].tax_form_type}</li>
            <li>Jahr: ${submission[0].tax_year}</li>
            <li>Status: ${submission[0].status}</li>
            <li>Berechtigung: ${permission_level}</li>
          </ul>
          ${message ? `<p>Nachricht: ${message}</p>` : ''}
          <p>Bitte melden Sie sich an, um die Details zu sehen.</p>
        `
      });

      shared.push({ email, permission_level, shared_at: new Date().toISOString() });
    }

    return Response.json({ 
      success: true, 
      shared_with: shared,
      message: `Submission mit ${shared.length} Personen geteilt`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});