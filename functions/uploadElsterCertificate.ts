import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { 
      certificate_name, 
      certificate_file, 
      certificate_password,
      certificate_type, 
      tax_number,
      valid_from,
      valid_until,
      supported_legal_forms
    } = await req.json();

    console.log('[CERT-UPLOAD] Uploading certificate:', certificate_name);

    // 1. Certificate-File hochladen (Base64 oder Binary)
    let certificateData;
    if (certificate_file.startsWith('data:')) {
      // Base64-encoded
      certificateData = certificate_file;
    } else {
      // Binary Upload via Core.UploadPrivateFile
      const uploadResponse = await base44.integrations.Core.UploadPrivateFile({
        file: certificate_file
      });
      certificateData = uploadResponse.file_uri;
    }

    // 2. Passwort verschlüsseln (Simulation - in Production: echte Verschlüsselung)
    const encryptedPassword = btoa(certificate_password); // Base64 als Platzhalter

    // 3. Zertifikat-Fingerprint berechnen (Simulation)
    const thumbprint = `SHA256:${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`;

    // 4. ElsterCertificate erstellen
    const certificate = await base44.asServiceRole.entities.ElsterCertificate.create({
      certificate_name,
      certificate_data: certificateData,
      certificate_password_encrypted: encryptedPassword,
      certificate_type,
      tax_number,
      valid_from,
      valid_until,
      supported_legal_forms: supported_legal_forms || ['PRIVATPERSON', 'GBR', 'GMBH', 'UG', 'AG'],
      is_active: true,
      certificate_thumbprint: thumbprint
    });

    // 5. Automatisch Verbindung testen
    const testResponse = await base44.functions.invoke('testElsterConnection', {
      certificate_id: certificate.id
    });

    return Response.json({ 
      success: true, 
      certificate_id: certificate.id,
      test_result: testResponse.data.test_result,
      message: 'Zertifikat erfolgreich hochgeladen und getestet'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});