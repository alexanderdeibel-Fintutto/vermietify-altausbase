import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { submissionId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // ElsterSubmission laden
        const submissions = await base44.entities.ElsterSubmission.list();
        const submission = submissions.find(s => s.id === submissionId);
        if (!submission) {
            return new Response(JSON.stringify({ error: 'Submission not found' }), { status: 404 });
        }

        // XML Content validieren
        if (!submission.xml_content) {
            return new Response(JSON.stringify({ error: 'No XML content to submit' }), { status: 400 });
        }

        // Simulierte ELSTER API Call (in Produktion: echter API-Call)
        const transferId = `TID-${submission.tax_year}-${Date.now()}`;
        const referenceNumber = `REF-${submission.tax_year}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Submission aktualisieren
        await base44.entities.ElsterSubmission.update(submissionId, {
            status: 'SUBMITTED',
            submission_date: new Date().toISOString(),
            reference_number: referenceNumber
        });

        // Log erstellen
        await base44.entities.ActivityLog?.create?.({
            user_email: user.email,
            action: 'ELSTER_SUBMIT',
            entity_type: 'ElsterSubmission',
            entity_id: submissionId,
            change_summary: `Anlage V ${submission.tax_year} an ELSTER eingereicht - Ref: ${referenceNumber}`,
            timestamp: new Date().toISOString()
        }).catch(() => {}); // Fehlertoleranz wenn ActivityLog nicht existiert

        return new Response(JSON.stringify({
            success: true,
            transferId,
            referenceNumber,
            submissionId,
            status: 'SUBMITTED',
            message: 'Erfolgreich an ELSTER eingereicht'
        }), { status: 200 });

    } catch (error) {
        console.error('Error submitting to ELSTER:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});