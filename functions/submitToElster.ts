import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { submission_id, certificate_id, pin } = await req.json();

        if (!pin) {
            return Response.json({ error: 'PIN is required' }, { status: 400 });
        }

        // Hole Submission
        const [submission] = await base44.asServiceRole.entities.ElsterSubmission.filter({ id: submission_id });
        if (!submission) {
            return Response.json({ error: 'Submission not found' }, { status: 404 });
        }

        if (submission.status !== 'ready') {
            return Response.json({ error: 'Submission is not ready for transmission' }, { status: 400 });
        }

        // Hole Certificate
        const [certificate] = await base44.asServiceRole.entities.ElsterCertificate.filter({ id: certificate_id });
        if (!certificate) {
            return Response.json({ error: 'Certificate not found' }, { status: 404 });
        }

        // Validiere PIN gegen gespeicherten Hash
        const pinHash = createHash('sha256').update(pin).digest('hex');
        if (certificate.pin_hash && pinHash !== certificate.pin_hash) {
            return Response.json({ error: 'Invalid PIN' }, { status: 401 });
        }

        // Prüfe Zertifikats-Gültigkeit
        const validUntil = new Date(certificate.valid_until);
        if (validUntil < new Date()) {
            return Response.json({ error: 'Certificate has expired' }, { status: 400 });
        }

        // Aktualisiere Status
        await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
            status: 'submitting'
        });

        // Hole ELSTER Settings
        const settings = await base44.asServiceRole.entities.ElsterSettings.filter({ user_email: user.email });
        const ericServiceUrl = settings[0]?.eric_service_url || Deno.env.get('ERIC_SERVICE_URL');
        const ericApiKey = Deno.env.get('ERIC_SERVICE_API_KEY');

        // Hole Zertifikatsdatei
        const { data: signedUrl } = await base44.integrations.Core.CreateFileSignedUrl({ 
            file_uri: certificate.certificate_file_uri 
        });
        const certResponse = await fetch(signedUrl.signed_url);
        const certBytes = await certResponse.arrayBuffer();
        const certificateBase64 = btoa(String.fromCharCode(...new Uint8Array(certBytes)));

        // Rufe ERiC-Microservice auf
        const ericResponse = await fetch(`${ericServiceUrl}/submissions/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ericApiKey
            },
            body: JSON.stringify({
                xml_content: submission.xml_content,
                certificate_file_base64: certificateBase64,
                pin: pin,
                test_mode: settings[0]?.test_mode !== false
            })
        });

        const result = await ericResponse.json();

        if (result.success) {
            // Speichere Protokoll-PDF
            let protocolFileUri = null;
            if (result.protocol_pdf_base64) {
                const pdfBytes = Uint8Array.from(atob(result.protocol_pdf_base64), c => c.charCodeAt(0));
                const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                const { data: uploadResult } = await base44.integrations.Core.UploadPrivateFile({ file: pdfBlob });
                protocolFileUri = uploadResult.file_uri;
            }

            // Aktualisiere Submission
            await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
                status: 'submitted',
                transfer_ticket: result.transfer_ticket,
                submission_timestamp: new Date().toISOString(),
                response_xml: result.server_response_xml,
                protocol_file_uri: protocolFileUri
            });

            // Aktualisiere TaxReturn
            await base44.asServiceRole.entities.TaxReturn.update(submission.tax_return_id, {
                status: 'submitted',
                elster_transfer_ticket: result.transfer_ticket,
                submission_date: new Date().toISOString()
            });

            // Aktualisiere Certificate last_used
            await base44.asServiceRole.entities.ElsterCertificate.update(certificate_id, {
                last_used: new Date().toISOString()
            });

            // Log
            await base44.asServiceRole.entities.ElsterLog.create({
                submission_id,
                action: 'submission_completed',
                timestamp: new Date().toISOString(),
                details: { transfer_ticket: result.transfer_ticket },
                success: true
            });

            return Response.json({ 
                success: true, 
                transfer_ticket: result.transfer_ticket,
                protocol_file_uri: protocolFileUri
            });

        } else {
            // Fehler bei Übermittlung
            await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
                status: result.errors?.some(e => e.code?.includes('REJECT')) ? 'rejected' : 'error',
                server_errors: result.errors,
                last_error: result.errors?.[0]?.message,
                retry_count: submission.retry_count + 1
            });

            // Log
            await base44.asServiceRole.entities.ElsterLog.create({
                submission_id,
                action: 'error',
                timestamp: new Date().toISOString(),
                success: false,
                error_message: result.errors?.[0]?.message
            });

            return Response.json({ 
                success: false, 
                errors: result.errors 
            }, { status: 400 });
        }

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        // WICHTIG: PIN aus Speicher löschen (Security)
        // In JavaScript wird das automatisch durch Garbage Collection gemacht
    }
});