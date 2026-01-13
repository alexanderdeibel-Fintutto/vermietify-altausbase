import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Webhook from Elster status updates
    const body = await req.json();
    const { submission_id, status, timestamp, message } = body;

    // Verify signature (simplified - in production use Elster's cert verification)
    const base44 = createClientFromRequest(req);

    // Find audit by submission_id
    const audits = await base44.asServiceRole.entities.ElsterComplianceAudit.list();
    const audit = audits.find(a => a.submission_id === submission_id);

    if (!audit) {
      console.log(`Unknown submission: ${submission_id}`);
      return Response.json({ received: true });
    }

    // Update status
    const statusMap = {
      'submitted': 'submitted',
      'accepted': 'accepted',
      'rejected': 'rejected',
      'processing': 'submitted'
    };

    const audit_log = JSON.parse(audit.audit_log || '[]');
    audit_log.push({
      timestamp: new Date().toISOString(),
      action: `elster_status_${status}`,
      message
    });

    await base44.asServiceRole.entities.ElsterComplianceAudit.update(audit.id, {
      submission_status: statusMap[status] || 'submitted',
      audit_log: JSON.stringify(audit_log)
    });

    // Send notification to user
    try {
      await base44.integrations.Core.SendEmail({
        to: audit.user_email,
        subject: `Elster Steuererklärung - ${status.toUpperCase()}`,
        body: `Ihre Steuererklärung (${submission_id}) wurde ${status === 'accepted' ? 'akzeptiert' : status === 'rejected' ? 'abgelehnt' : 'verarbeitet'}. ${message ? `Nachricht: ${message}` : ''}`
      });
    } catch (emailError) {
      console.warn('Email notification failed:', emailError);
    }

    return Response.json({ success: true, submission_id });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});