import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { submission_id } = await req.json();

        // Hole Submission
        const [submission] = await base44.asServiceRole.entities.ElsterSubmission.filter({ id: submission_id });
        if (!submission) {
            return Response.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Aktualisiere Status
        await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
            status: 'validating'
        });

        // Hole ELSTER Settings
        const settings = await base44.asServiceRole.entities.ElsterSettings.filter({ user_email: user.email });
        const ericServiceUrl = settings[0]?.eric_service_url || Deno.env.get('ERIC_SERVICE_URL');
        const ericApiKey = Deno.env.get('ERIC_SERVICE_API_KEY');

        // Rufe ERiC-Microservice auf
        const response = await fetch(`${ericServiceUrl}/submissions/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ericApiKey
            },
            body: JSON.stringify({
                xml_content: submission.xml_content
            })
        });

        const result = await response.json();

        // Mappe ELSTER-Fehlercodes auf verständliche Meldungen
        const translatedErrors = (result.errors || []).map(err => ({
            code: err.code,
            field: err.field,
            message: translateElsterError(err.code, err.message),
            severity: 'error'
        }));

        const translatedWarnings = (result.warnings || []).map(warn => ({
            code: warn.code,
            field: warn.field,
            message: warn.message,
            severity: 'warning'
        }));

        const allIssues = [...translatedErrors, ...translatedWarnings];

        // Aktualisiere Submission
        await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
            status: result.valid ? 'ready' : 'validation_failed',
            validation_errors: translatedErrors,
            hints: translatedWarnings.map(w => w.message)
        });

        // Log
        await base44.asServiceRole.entities.ElsterLog.create({
            submission_id,
            action: 'validation_completed',
            timestamp: new Date().toISOString(),
            details: { valid: result.valid, error_count: translatedErrors.length },
            success: true
        });

        return Response.json({ 
            success: true,
            valid: result.valid, 
            errors: translatedErrors,
            warnings: translatedWarnings
        });

    } catch (error) {
        // Log error
        const { submission_id } = await req.json();
        await base44.asServiceRole.entities.ElsterLog.create({
            submission_id,
            action: 'error',
            timestamp: new Date().toISOString(),
            success: false,
            error_message: error.message
        });

        return Response.json({ error: error.message }, { status: 500 });
    }
});

function translateElsterError(code, originalMessage) {
    const translations = {
        'ERIC_GLOBAL_PRUEF_FEHLER': 'Prüffehler im Datensatz. Bitte prüfen Sie Ihre Angaben.',
        'ERIC_TRANSFER_ERR_CONNECTSERVER': 'Verbindung zum ELSTER-Server fehlgeschlagen. Bitte versuchen Sie es später erneut.',
        'ERIC_TRANSFER_ERR_NORESPONSE': 'Keine Antwort vom ELSTER-Server erhalten.',
        'ERIC_CRYPT_ERROR_P7_READ': 'Zertifikat konnte nicht gelesen werden.',
        'ERIC_CRYPT_ERROR_PIN_WRONG': 'Die eingegebene PIN ist falsch.',
        'ERIC_CRYPT_ERROR_CERT_EXPIRED': 'Das Zertifikat ist abgelaufen.',
        'ERIC_TRANSFER_ERR_SEND': 'Fehler beim Senden der Daten.',
        'ERIC_GLOBAL_NULL_PARAMETER': 'Es fehlen erforderliche Parameter.'
    };

    return translations[code] || originalMessage || 'Unbekannter Fehler';
}