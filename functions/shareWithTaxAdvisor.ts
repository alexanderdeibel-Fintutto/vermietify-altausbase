import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, advisor_email, advisor_name, message } = await req.json();

    if (!submission_id || !advisor_email) {
      return Response.json({ error: 'submission_id and advisor_email required' }, { status: 400 });
    }

    console.log(`[SHARE] Sharing submission ${submission_id} with ${advisor_email}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submission || submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // Generiere PDF
    const pdfResponse = await base44.functions.invoke('exportTaxFormPDF', { 
      submission_id 
    });

    let pdfUrl = null;
    if (pdfResponse.data.success) {
      // Upload PDF
      const uploadResponse = await base44.integrations.Core.UploadFile({
        file: new Blob([pdfResponse.data.pdf_data], { type: 'application/pdf' })
      });
      pdfUrl = uploadResponse.file_url;
    }

    // Sende E-Mail an Steuerberater
    const emailBody = `
Hallo${advisor_name ? ` ${advisor_name}` : ''},

${user.full_name || user.email} hat ein ELSTER-Steuerformular mit Ihnen geteilt:

📋 Formular: ${sub.tax_form_type}
📅 Steuerjahr: ${sub.tax_year}
⚖️ Rechtsform: ${sub.legal_form}
✅ Status: ${sub.status}

${message ? `\nNachricht:\n${message}\n` : ''}

${pdfUrl ? `\nSie können das Formular hier herunterladen:\n${pdfUrl}\n` : ''}

📊 Zusammenfassung der Daten:
${Object.entries(sub.form_data || {})
  .slice(0, 5)
  .map(([key, value]) => `- ${key}: ${typeof value === 'number' ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : value}`)
  .join('\n')}

Bei Fragen können Sie sich direkt an ${user.email} wenden.

Mit freundlichen Grüßen
Ihr ImmoVerwalter-Team
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: advisor_email,
      from_name: 'ImmoVerwalter ELSTER',
      subject: `Steuerformular ${sub.tax_form_type} ${sub.tax_year} - Freigabe von ${user.full_name || user.email}`,
      body: emailBody
    });

    // Log Audit Event
    await base44.functions.invoke('logElsterAuditEvent', {
      submission_id,
      event_type: 'SHARED_WITH_ADVISOR',
      details: `Mit Steuerberater geteilt: ${advisor_email}`,
      metadata: { advisor_email, advisor_name }
    });

    console.log('[SUCCESS] Submission shared with tax advisor');

    return Response.json({
      success: true,
      message: `Formular erfolgreich mit ${advisor_email} geteilt`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});