import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    const submission = await base44.asServiceRole.entities.ElsterSubmission.get(submission_id);
    
    if (!submission || !submission.xml_data) {
      return Response.json({ error: 'Invalid submission' }, { status: 400 });
    }

    // Zertifikat laden
    const certificates = await base44.asServiceRole.entities.ElsterCertificate.filter({
      certificate_type: submission.submission_mode,
      is_active: true
    });

    if (certificates.length === 0) {
      return Response.json({ 
        error: `Kein ${submission.submission_mode}-Zertifikat gefunden` 
      }, { status: 400 });
    }

    const certificate = certificates[0];

    // SIMULIERTE ELSTER-ÜBERMITTLUNG
    // In Produktion: ERiC-Bibliothek verwenden
    const transferTicket = `TT${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const simulatedResponse = {
      transferTicket,
      returnCode: '0',
      returnMessage: submission.submission_mode === 'TEST' 
        ? 'Test-Übermittlung erfolgreich' 
        : 'Übermittlung erfolgreich',
      serverStatus: 'OK',
      timestamp: new Date().toISOString()
    };

    // Status aktualisieren
    await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
      status: 'SUBMITTED',
      transfer_ticket: transferTicket,
      elster_response: simulatedResponse,
      submission_date: new Date().toISOString(),
      certificate_used: certificate.id
    });

    // Nach 2 Sekunden automatisch auf ACCEPTED setzen (Simulation)
    setTimeout(async () => {
      try {
        await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
          status: 'ACCEPTED'
        });
      } catch (e) {
        console.error('Background update failed:', e);
      }
    }, 2000);

    return Response.json({
      success: true,
      transfer_ticket: transferTicket,
      message: simulatedResponse.returnMessage,
      mode: submission.submission_mode
    });

  } catch (error) {
    console.error('Error submitting to ELSTER:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});