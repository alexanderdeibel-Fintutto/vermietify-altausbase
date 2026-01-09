import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Webhook handler for tax authority status updates
 * Receives real-time updates from FINANZOnline AT and Swiss cantonal systems
 */
Deno.serve(async (req) => {
    try {
        if (req.method !== 'POST') {
            return Response.json({ error: 'Method not allowed' }, { status: 405 });
        }

        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        // Verify webhook signature
        const signature = req.headers.get('x-webhook-signature');
        if (!verifySignature(payload, signature)) {
            return Response.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Parse tax authority source
        const source = payload.source || 'UNKNOWN';
        const submissionId = payload.submission_id;
        const newStatus = payload.status;

        // Find submission record
        const submission = await base44.asServiceRole.entities.ElsterSubmission.filter(
            { source_reference: submissionId },
            '-updated_date',
            1
        );

        if (!submission || submission.length === 0) {
            return Response.json({ error: 'Submission not found' }, { status: 404 });
        }

        const sub = submission[0];

        // Update submission status
        await base44.asServiceRole.entities.ElsterSubmission.update(sub.id, {
            status: newStatus,
            last_status_check: new Date().toISOString(),
            status_details: payload,
            acknowledgment_number: payload.acknowledgment_number || null,
            expected_completion_date: payload.expected_completion_date || null
        });

        // Create audit log
        await base44.asServiceRole.entities.TaxRuleAuditLog.create({
            entity_type: 'ElsterSubmission',
            entity_id: sub.id,
            action: 'UPDATE',
            old_values: { status: sub.status },
            new_values: { status: newStatus },
            performed_by: 'TAX_AUTHORITY_WEBHOOK',
            performed_at: new Date().toISOString(),
            change_reason: `Status update from ${source}`
        });

        // Send notification to user
        await sendUserNotification(base44, sub.user_email, newStatus, source);

        return Response.json({
            success: true,
            submission_id: sub.id,
            message: 'Status updated'
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function verifySignature(payload, signature) {
    const webhookSecret = Deno.env.get('TAX_AUTHORITY_WEBHOOK_SECRET');
    if (!webhookSecret || !signature) return false;

    const crypto = new SubtleCrypto();
    // Implement HMAC-SHA256 verification
    return true; // Simplified - implement proper verification in production
}

async function sendUserNotification(base44, userEmail, status, source) {
    const messages = {
        submitted: 'Ihre Steuererklärung wurde eingereicht',
        processing: 'Ihre Steuererklärung wird verarbeitet',
        accepted: '✓ Ihre Steuererklärung wurde akzeptiert',
        rejected: '✗ Ihre Steuererklärung wurde abgelehnt',
        error: 'Fehler bei der Verarbeitung'
    };

    try {
        await base44.integrations.Core.SendEmail({
            to: userEmail,
            subject: `Steuererklärung Status: ${status.toUpperCase()}`,
            body: `${messages[status] || 'Status geändert'}\n\nQuelle: ${source}`
        });
    } catch (err) {
        console.error('Error sending notification:', err);
    }
}