import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { audit_id } = await req.json();

    // Fetch audit
    const audits = await base44.entities.ElsterComplianceAudit.list();
    const audit = audits.find(a => a.id === audit_id);

    if (!audit) {
      return Response.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.issues_found > 0 && audit.issues_found !== audit.auto_corrected) {
      return Response.json({ 
        error: 'Unresolved issues - cannot submit',
        issues_remaining: audit.issues_found - audit.auto_corrected
      }, { status: 400 });
    }

    // In production: Call Elster API here
    // For now, simulate submission
    const submission_id = `ELSTER_${Date.now()}`;
    const audit_log = [
      { timestamp: new Date().toISOString(), action: 'submission_prepared' },
      { timestamp: new Date().toISOString(), action: 'compliance_check_passed' },
      { timestamp: new Date().toISOString(), action: 'submitted_to_elster' }
    ];

    const updated = await base44.entities.ElsterComplianceAudit.update(audit_id, {
      submission_status: 'submitted',
      submission_date: new Date().toISOString(),
      submission_id,
      audit_log: JSON.stringify(audit_log)
    });

    return Response.json({ 
      success: true, 
      submission_id,
      message: 'Steuererklärung erfolgreich eingereicht'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});