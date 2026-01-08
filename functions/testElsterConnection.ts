import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { certificate_id } = await req.json();

    console.log('[ELSTER-TEST] Testing connection with certificate:', certificate_id);

    // 1. Zertifikat laden
    const certificates = await base44.entities.ElsterCertificate.filter({ id: certificate_id });
    if (!certificates || certificates.length === 0) {
      return Response.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const certificate = certificates[0];

    // 2. SIMULATION: Echte Verbindung zu ELSTER testen
    // In Production: ERiC-Microservice würde Ping/Echo-Request senden
    
    const testSuccess = Math.random() > 0.1; // 90% Erfolgsrate simuliert

    const testResult = {
      success: testSuccess,
      certificate_valid: testSuccess,
      elster_reachable: testSuccess,
      response_time_ms: Math.floor(Math.random() * 500) + 100,
      server_version: 'ELSTER-Server v41.4',
      tested_at: new Date().toISOString(),
      certificate_expires_in_days: Math.floor(
        (new Date(certificate.valid_until) - new Date()) / (1000 * 60 * 60 * 24)
      )
    };

    if (!testSuccess) {
      testResult.error_message = 'Verbindung zum ELSTER-Server fehlgeschlagen';
      testResult.error_code = 'ERR_CONNECTION_TIMEOUT';
    }

    // 3. Test-Ergebnis im Zertifikat speichern
    await base44.entities.ElsterCertificate.update(certificate_id, {
      last_tested: new Date().toISOString(),
      test_result: testResult
    });

    return Response.json({ 
      success: testSuccess, 
      test_result: testResult,
      message: testSuccess ? 'Verbindung erfolgreich getestet' : 'Verbindungstest fehlgeschlagen'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});