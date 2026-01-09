import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Scheduled task to check tax submission status daily
 * Runs automatically every night to update submission status
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all pending submissions
        const pendingSubmissions = await base44.asServiceRole.entities.ElsterSubmission.filter(
            { status: { $in: ['submitted', 'processing'] } },
            '-updated_date',
            100
        );

        const results = {
            total: pendingSubmissions.length,
            updated: 0,
            errors: 0
        };

        for (const submission of pendingSubmissions) {
            try {
                let statusCheckUrl = '';

                // Build appropriate status check URL
                if (submission.country === 'AT') {
                    statusCheckUrl = `https://finanzonline.bmf.gv.at/api/status/${submission.source_reference}`;
                } else if (submission.country === 'CH') {
                    const cantonEndpoints = {
                        ZH: 'https://www.myprofessional.zh.ch/api/status',
                        BE: 'https://steuerveranlagung.be.ch/api/status',
                        AG: 'https://etax.ag.ch/api/status',
                        SG: 'https://steuererklarung.sg.ch/api/status',
                        BS: 'https://bs-steueramt.portal.bs.ch/api/status'
                    };
                    statusCheckUrl = `${cantonEndpoints[submission.canton]}/${submission.source_reference}`;
                }

                const response = await fetch(statusCheckUrl, {
                    headers: {
                        'Authorization': `Bearer ${Deno.env.get('TAX_AUTHORITY_API_KEY')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const newStatus = mapStatus(data.status);

                    // Update submission
                    await base44.asServiceRole.entities.ElsterSubmission.update(submission.id, {
                        status: newStatus,
                        last_status_check: new Date().toISOString(),
                        status_details: data,
                        acknowledgment_number: data.acknowledgment_number || submission.acknowledgment_number
                    });

                    results.updated++;

                    // Send notification if status changed to accepted/rejected
                    if ((newStatus === 'accepted' || newStatus === 'rejected') && submission.status !== newStatus) {
                        await sendStatusNotification(submission, newStatus);
                    }
                }
            } catch (err) {
                results.errors++;
                console.error(`Error checking status for submission ${submission.id}:`, err);
            }
        }

        return Response.json({
            success: true,
            message: `Status check complete: ${results.updated} updated, ${results.errors} errors`,
            results
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function mapStatus(externalStatus) {
    const statusMap = {
        'eingereicht': 'submitted',
        'verarbeitet': 'processing',
        'akzeptiert': 'accepted',
        'abgelehnt': 'rejected',
        'submitted': 'submitted',
        'processing': 'processing',
        'accepted': 'accepted',
        'rejected': 'rejected'
    };
    return statusMap[externalStatus?.toLowerCase()] || 'unknown';
}

async function sendStatusNotification(submission, newStatus) {
    try {
        const message = newStatus === 'accepted'
            ? `Ihre Steuererklärung für ${submission.tax_year} wurde akzeptiert`
            : `Ihre Steuererklärung für ${submission.tax_year} wurde abgelehnt`;

        await fetch(`${Deno.env.get('APP_BASE_URL')}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_email: submission.user_email,
                title: 'Steuererklärung Status',
                message,
                type: newStatus === 'accepted' ? 'success' : 'error'
            })
        });
    } catch (err) {
        console.error('Error sending notification:', err);
    }
}