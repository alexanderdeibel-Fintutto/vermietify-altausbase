import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const certificateFile = formData.get('certificate_file');
        const pin = formData.get('pin');
        const name = formData.get('name');

        if (!certificateFile || !pin || !name) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validiere Dateiformat
        const fileName = certificateFile.name;
        if (!fileName.endsWith('.pfx') && !fileName.endsWith('.p12')) {
            return Response.json({ error: 'Invalid file format. Only .pfx or .p12 allowed.' }, { status: 400 });
        }

        // Speichere Zertifikat in privateStorage
        const { data: uploadResult } = await base44.integrations.Core.UploadPrivateFile({ file: certificateFile });
        const certificateFileUri = uploadResult.file_uri;

        // Rufe ERiC-Microservice zur Validierung auf
        const settings = await base44.asServiceRole.entities.ElsterSettings.filter({ user_email: user.email });
        const ericServiceUrl = settings[0]?.eric_service_url || Deno.env.get('ERIC_SERVICE_URL');
        const ericApiKey = Deno.env.get('ERIC_SERVICE_API_KEY');

        if (!ericServiceUrl) {
            return Response.json({ error: 'ERiC service URL not configured' }, { status: 500 });
        }

        // Konvertiere Zertifikat zu Base64
        const certificateBytes = await certificateFile.arrayBuffer();
        const certificateBase64 = btoa(String.fromCharCode(...new Uint8Array(certificateBytes)));

        const validationResponse = await fetch(`${ericServiceUrl}/certificates/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ericApiKey
            },
            body: JSON.stringify({
                certificate_file_base64: certificateBase64,
                pin: pin
            })
        });

        const validationResult = await validationResponse.json();

        if (!validationResult.valid) {
            // Lösche hochgeladene Datei
            // await base44.asServiceRole.storage.delete(certificateFileUri);
            
            await base44.asServiceRole.entities.ElsterLog.create({
                action: 'certificate_uploaded',
                timestamp: new Date().toISOString(),
                success: false,
                error_message: validationResult.error || 'Certificate validation failed'
            });

            return Response.json({ error: validationResult.error || 'Invalid certificate or PIN' }, { status: 400 });
        }

        // Hash der PIN (für spätere Validierung, NICHT die PIN selbst speichern!)
        const pinHash = createHash('sha256').update(pin).digest('hex');

        // Erstelle ElsterCertificate Entity
        const certificate = await base44.asServiceRole.entities.ElsterCertificate.create({
            name,
            certificate_type: 'soft_pse',
            holder_name: validationResult.holder_name,
            holder_tax_id: validationResult.tax_id,
            valid_from: validationResult.valid_from,
            valid_until: validationResult.valid_until,
            issuer: validationResult.issuer || 'ELSTER',
            serial_number: validationResult.serial_number,
            certificate_file_uri: certificateFileUri,
            pin_hash: pinHash,
            is_active: true,
            status: 'active'
        });

        // Log erfolgreiches Hochladen
        await base44.asServiceRole.entities.ElsterLog.create({
            action: 'certificate_uploaded',
            timestamp: new Date().toISOString(),
            details: { certificate_id: certificate.id, holder_name: validationResult.holder_name },
            success: true
        });

        return Response.json({ 
            success: true, 
            certificate: {
                id: certificate.id,
                name: certificate.name,
                holder_name: certificate.holder_name,
                valid_until: certificate.valid_until
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});