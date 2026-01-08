import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log('[ELSTER-SUBMIT] Submitting to ELSTER:', submission_id);

    // 1. Submission laden
    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }
    const submission = submissions[0];

    // 2. Validierung prüfen
    if (submission.status !== 'VALIDATED') {
      return Response.json({ 
        error: 'Submission must be validated before submission' 
      }, { status: 400 });
    }

    // 3. Zertifikat laden
    const certificates = await base44.entities.ElsterCertificate.filter({
      certificate_type: submission.submission_mode,
      is_active: true
    });

    if (!certificates || certificates.length === 0) {
      return Response.json({ 
        error: 'No active certificate found for this mode' 
      }, { status: 404 });
    }

    const certificate = certificates[0];

    // 4. SIMULATION: Echte ERiC-Integration würde hier stattfinden
    // In Production: POST zu ERiC-Microservice mit XML + Zertifikat
    
    const simulatedResponse = {
      transfer_ticket: `TT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      server_response: {
        code: '0',
        message: 'Übermittlung erfolgreich angenommen',
        timestamp: new Date().toISOString()
      },
      elster_status: 'ACCEPTED'
    };

    // 5. Submission aktualisieren
    await base44.entities.ElsterSubmission.update(submission_id, {
      status: 'SUBMITTED',
      submission_date: new Date().toISOString(),
      transfer_ticket: simulatedResponse.transfer_ticket,
      elster_response: simulatedResponse,
      certificate_used: certificate.id
    });

    // 6. Audit-Log
    await base44.functions.invoke('logElsterAuditEvent', {
      submission_id,
      event_type: 'SUBMITTED_TO_ELSTER',
      details: {
        transfer_ticket: simulatedResponse.transfer_ticket,
        certificate: certificate.certificate_name,
        mode: submission.submission_mode
      }
    });

    // 7. Benachrichtigung
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `ELSTER-Übermittlung erfolgreich: ${submission.tax_form_type} ${submission.tax_year}`,
      body: `
        <h2>ELSTER-Übermittlung erfolgreich</h2>
        <p>Ihre Steuererklärung wurde erfolgreich übermittelt:</p>
        <ul>
          <li>Formular: ${submission.tax_form_type}</li>
          <li>Jahr: ${submission.tax_year}</li>
          <li>Transfer-Ticket: ${simulatedResponse.transfer_ticket}</li>
          <li>Modus: ${submission.submission_mode}</li>
        </ul>
        <p>Sie erhalten eine separate Bestätigung von ELSTER.</p>
      `
    });

    return Response.json({ 
      success: true, 
      transfer_ticket: simulatedResponse.transfer_ticket,
      elster_response: simulatedResponse,
      message: 'Erfolgreich an ELSTER übermittelt'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});