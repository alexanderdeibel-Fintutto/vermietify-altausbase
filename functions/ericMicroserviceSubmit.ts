import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    const { submission_id, test_mode = true } = await req.json();

    console.log('[ERiC-SUBMIT] Submitting to ELSTER via ERiC Microservice', test_mode ? '(TEST)' : '(PROD)');

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions?.length) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // Hole Zertifikat
    const certs = await base44.entities.ElsterCertificate.filter({
      certificate_type: test_mode ? 'TEST' : 'PRODUCTION',
      is_active: true
    });

    if (!certs?.length) {
      return Response.json({ error: 'Kein Zertifikat verfügbar' }, { status: 400 });
    }

    const cert = certs[0];

    // ERiC Microservice URL (würde in Realität extern laufen)
    const ericUrl = test_mode 
      ? 'https://eric-test.bdr-online.de'
      : 'https://eric.bdr-online.de';

    // Payload für ERiC
    const ericPayload = {
      xml_data: submission.xml_data,
      certificate_b64: cert.certificate_data,
      certificate_password: cert.certificate_password_encrypted,
      tax_number: cert.tax_number,
      sender_id: user.email,
      test_mode
    };

    // ERiC Microservice aufrufen
    const ericResponse = await fetch(`${ericUrl}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ericPayload)
    });

    if (!ericResponse.ok) {
      const error = await ericResponse.text();
      return Response.json({ 
        success: false, 
        error: 'ERiC submission failed',
        details: error 
      }, { status: 400 });
    }

    const ericData = await ericResponse.json();

    // Submission aktualisieren
    await base44.entities.ElsterSubmission.update(submission_id, {
      status: ericData.status === 'ACCEPTED' ? 'ACCEPTED' : 'SUBMITTED',
      transfer_ticket: ericData.transfer_ticket,
      elster_response: ericData,
      submission_date: new Date().toISOString()
    });

    // Audit-Log
    await base44.functions.invoke('logElsterAuditEvent', {
      submission_id,
      event_type: 'SUBMITTED_TO_ELSTER',
      details: { transfer_ticket: ericData.transfer_ticket, test_mode }
    });

    return Response.json({ 
      success: true, 
      status: ericData.status,
      transfer_ticket: ericData.transfer_ticket
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});