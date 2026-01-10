import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, report_type, period_start, period_end } = await req.json();

    let summary = {};
    let issues = [];

    if (report_type === 'audit_trail') {
      const logs = await base44.asServiceRole.entities.AuditLog.filter({
        company_id
      });
      
      const filtered = logs.filter(l => {
        const date = new Date(l.created_date);
        return date >= new Date(period_start) && date <= new Date(period_end);
      });

      summary = {
        total_actions: filtered.length,
        by_type: {},
        by_user: {}
      };

      filtered.forEach(log => {
        summary.by_type[log.action_type] = (summary.by_type[log.action_type] || 0) + 1;
        summary.by_user[log.user_email] = (summary.by_user[log.user_email] || 0) + 1;
      });
    }

    if (report_type === 'gdpr_compliance') {
      const allDocs = await base44.asServiceRole.entities.Document.filter({ company_id });
      
      issues = allDocs
        .filter(d => d.contains_personal_data && !d.data_classification)
        .map(d => ({
          document_id: d.id,
          issue: 'Personendaten ohne Klassifizierung',
          severity: 'high'
        }));

      summary = {
        total_documents: allDocs.length,
        documents_with_personal_data: allDocs.filter(d => d.contains_personal_data).length,
        compliance_issues: issues.length
      };
    }

    const report = await base44.asServiceRole.entities.ComplianceReport.create({
      company_id,
      report_type,
      period_start,
      period_end,
      summary,
      issues,
      generated_by: user.email,
      export_format: 'json'
    });

    return Response.json({ success: true, report });
  } catch (error) {
    console.error('Compliance report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});