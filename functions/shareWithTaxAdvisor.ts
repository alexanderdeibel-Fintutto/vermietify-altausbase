import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, advisor_email, message } = await req.json();

    if (!submission_id || !advisor_email) {
      return Response.json({ 
        error: 'submission_id and advisor_email required' 
      }, { status: 400 });
    }

    console.log(`[SHARE] Sharing ${submission_id} with ${advisor_email}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // Generiere PDF wenn noch nicht vorhanden
    let pdfUrl = sub.pdf_url;
    if (!pdfUrl) {
      const pdfResponse = await base44.functions.invoke('generateSubmissionPDF', {
        submission_id: sub.id
      });
      pdfUrl = pdfResponse.data?.pdf_url;
    }

    // Erstelle Share-Link mit Token
    const shareToken = crypto.randomUUID();
    
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'shared_with_advisor',
      user_id: user.id,
      metadata: {
        advisor_email,
        share_token: shareToken,
        shared_at: new Date().toISOString()
      }
    });

    // Sende E-Mail an Steuerberater
    const emailBody = `
Hallo,

${user.full_name} (${user.email}) hat eine ELSTER-Einreichung mit Ihnen geteilt:

Formular: ${sub.tax_form_type}
Steuerjahr: ${sub.tax_year}
Status: ${sub.status}

${message ? `Nachricht: ${message}` : ''}

${pdfUrl ? `PDF: ${pdfUrl}` : ''}

Mit freundlichen Grüßen,
Ihr ELSTER-Integrations-Team
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: advisor_email,
      subject: `ELSTER-Einreichung von ${user.full_name}`,
      body: emailBody
    });

    console.log(`[SHARE] Sent to ${advisor_email}`);

    return Response.json({
      success: true,
      share_token: shareToken,
      shared_with: advisor_email
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});