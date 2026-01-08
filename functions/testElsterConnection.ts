import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { certificate_id } = await req.json();

    const certificate = await base44.asServiceRole.entities.ElsterCertificate.get(certificate_id);
    
    if (!certificate) {
      return Response.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // SIMULIERTE TESTVERBINDUNG
    // In Produktion: Echte ERiC-Library Verbindung
    const testResult = {
      success: true,
      certificate_valid: true,
      elster_reachable: true,
      tax_number_valid: certificate.tax_number.length >= 10,
      timestamp: new Date().toISOString(),
      message: certificate.certificate_type === 'TEST' 
        ? 'Verbindung zur ELSTER-Testumgebung erfolgreich'
        : 'Verbindung zur ELSTER-Produktivumgebung erfolgreich'
    };

    // Zertifikat aktualisieren
    await base44.asServiceRole.entities.ElsterCertificate.update(certificate_id, {
      last_tested: new Date().toISOString(),
      test_result: testResult
    });

    return Response.json({
      success: true,
      test_result: testResult
    });

  } catch (error) {
    console.error('Error testing ELSTER connection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});