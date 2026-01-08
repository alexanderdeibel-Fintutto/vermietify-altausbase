import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('certificate_file');
    const password = formData.get('password');
    const certificate_type = formData.get('certificate_type');
    const tax_number = formData.get('tax_number');
    const certificate_name = formData.get('certificate_name');

    if (!file || !password || !certificate_type || !tax_number) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Datei hochladen
    const uploadResult = await base44.integrations.Core.UploadPrivateFile({ file });
    
    if (!uploadResult.file_uri) {
      return Response.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Zertifikat-Daten erstellen
    const certificate = await base44.asServiceRole.entities.ElsterCertificate.create({
      certificate_name: certificate_name || `${certificate_type} Zertifikat`,
      certificate_data: uploadResult.file_uri,
      certificate_password_encrypted: btoa(password), // In Produktion: echte Verschlüsselung
      certificate_type,
      tax_number,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supported_legal_forms: ['PRIVATPERSON', 'GBR', 'GMBH', 'UG', 'AG'],
      is_active: true
    });

    return Response.json({
      success: true,
      certificate_id: certificate.id,
      message: 'Zertifikat erfolgreich hochgeladen'
    });

  } catch (error) {
    console.error('Error uploading certificate:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});