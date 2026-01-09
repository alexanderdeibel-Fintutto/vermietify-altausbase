import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Submit tax forms to FINANZOnline Austria
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tax_form_id, tax_year, form_type } = await req.json();

        // Verify user is connected to FINANZOnline
        if (!user.finanzonline_connected) {
            return Response.json({ 
                error: 'FINANZOnline nicht verbunden',
                connect_required: true
            }, { status: 403 });
        }

        // Fetch tax form data
        const taxForm = await base44.entities.TaxForm.filter(
            { id: tax_form_id },
            '-updated_date',
            1
        );

        if (!taxForm || taxForm.length === 0) {
            return Response.json({ error: 'Tax form not found' }, { status: 404 });
        }

        // Build FINANZOnline XML submission payload
        const payload = buildFINANZOnlinePayload(taxForm[0], form_type);

        // Submit to FINANZOnline API
        const submitResponse = await fetch('https://finanzonline.bmf.gv.at/api/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.finanzonline_access_token}`,
                'Content-Type': 'application/xml'
            },
            body: payload
        });

        if (!submitResponse.ok) {
            throw new Error(`FINANZOnline submission failed: ${submitResponse.statusText}`);
        }

        const result = await submitResponse.text();
        const submissionId = extractSubmissionId(result);

        // Log submission in ElsterSubmission entity
        await base44.asServiceRole.entities.ElsterSubmission.create({
            user_email: user.email,
            country: 'AT',
            tax_year,
            form_type,
            status: 'submitted',
            submission_id: submissionId,
            submission_date: new Date().toISOString(),
            source_system: 'FINANZONLINE',
            source_reference: submissionId
        });

        // Create audit log
        await base44.asServiceRole.entities.TaxRuleAuditLog.create({
            entity_type: 'TaxForm',
            entity_id: tax_form_id,
            action: 'SUBMIT',
            new_values: { status: 'submitted', submission_id: submissionId },
            performed_by: user.email,
            performed_at: new Date().toISOString(),
            change_reason: 'Submitted to FINANZOnline AT'
        });

        return Response.json({
            success: true,
            submission_id: submissionId,
            status: 'submitted',
            message: 'Erklärung erfolgreich eingereicht'
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function buildFINANZOnlinePayload(taxForm, formType) {
    // Transform tax form data to FINANZOnline XML format
    return `<?xml version="1.0" encoding="UTF-8"?>
<SteuererklaerungAT>
    <FormType>${formType}</FormType>
    <TaxYear>${taxForm.tax_year}</TaxYear>
    <PersonalData>
        <PIN>${taxForm.pin}</PIN>
    </PersonalData>
    <FormData>${JSON.stringify(taxForm.form_data)}</FormData>
    <SubmissionDate>${new Date().toISOString()}</SubmissionDate>
</SteuererklaerungAT>`;
}

function extractSubmissionId(xmlResponse) {
    const match = xmlResponse.match(/<SubmissionID>([^<]+)<\/SubmissionID>/);
    return match ? match[1] : null;
}