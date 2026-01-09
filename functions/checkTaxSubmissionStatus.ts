import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Check submission status at tax authorities
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { submission_id, country } = await req.json();

        // Fetch submission record
        const submission = await base44.entities.ElsterSubmission.filter(
            { id: submission_id, user_email: user.email },
            '-updated_date',
            1
        );

        if (!submission || submission.length === 0) {
            return Response.json({ error: 'Submission not found' }, { status: 404 });
        }

        let status = submission[0].status;
        let details = null;

        // Check status at relevant tax authority
        if (country === 'AT') {
            const response = await fetch(`https://finanzonline.bmf.gv.at/api/status/${submission[0].source_reference}`, {
                headers: {
                    'Authorization': `Bearer ${user.finanzonline_access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                status = data.status;
                details = data;
            }
        } else if (country === 'CH') {
            // Check cantonal portal
            const cantonApi = getCantonalApiEndpoint(submission[0].canton);
            const response = await fetch(`${cantonApi}/status/${submission[0].source_reference}`, {
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('CANTONAL_ETAX_TOKEN')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                status = mapCantonalStatus(data);
                details = data;
            }
        }

        // Update submission record
        await base44.entities.ElsterSubmission.update(submission[0].id, {
            status,
            last_status_check: new Date().toISOString(),
            status_details: details
        });

        return Response.json({
            success: true,
            submission_id,
            status,
            details,
            last_updated: new Date().toISOString()
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function getCantonalApiEndpoint(canton) {
    const endpoints = {
        ZH: 'https://www.myprofessional.zh.ch/api',
        BE: 'https://steuerveranlagung.be.ch/api',
        AG: 'https://etax.ag.ch/api',
        SG: 'https://steuererklarung.sg.ch/api',
        BS: 'https://bs-steueramt.portal.bs.ch/api'
    };
    return endpoints[canton] || null;
}

function mapCantonalStatus(data) {
    // Normalize cantonal status responses to standard values
    const statusMap = {
        'eingereicht': 'submitted',
        'verarbeitet': 'processing',
        'akzeptiert': 'accepted',
        'abgelehnt': 'rejected',
        'fehler': 'error'
    };
    return statusMap[data.status?.toLowerCase()] || 'unknown';
}