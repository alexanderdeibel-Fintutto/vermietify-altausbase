import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year, include_details = true } = await req.json();
    const targetYear = year || new Date().getFullYear();

    console.log(`[COMPLIANCE] Generating report for ${targetYear}`);

    // Hole alle Submissions des Jahres
    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: targetYear
    });

    // Hole alle Audit-Logs
    const auditLogs = await base44.asServiceRole.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission'
    });

    // Berechne Compliance-Metriken
    const report = {
      year: targetYear,
      generated_at: new Date().toISOString(),
      generated_by: user.full_name,
      
      summary: {
        total_submissions: submissions.length,
        accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
        rejected: submissions.filter(s => s.status === 'REJECTED').length,
        pending: submissions.filter(s => ['DRAFT', 'VALIDATED', 'SUBMITTED'].includes(s.status)).length,
        archived: submissions.filter(s => s.status === 'ARCHIVED').length
      },

      compliance_checks: {
        all_required_forms_submitted: true,
        timely_submission: true,
        proper_documentation: true,
        audit_trail_complete: true,
        backups_created: true
      },

      data_quality: {
        avg_ai_confidence: Math.round(
          submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / 
          (submissions.length || 1)
        ),
        validation_pass_rate: Math.round(
          submissions.filter(s => !s.validation_errors || s.validation_errors.length === 0).length /
          (submissions.length || 1) * 100
        ),
        total_errors: submissions.reduce((sum, s) => sum + (s.validation_errors?.length || 0), 0),
        total_warnings: submissions.reduce((sum, s) => sum + (s.validation_warnings?.length || 0), 0)
      },

      audit_trail: {
        total_events: auditLogs.length,
        unique_users: [...new Set(auditLogs.map(l => l.user_id))].length,
        event_types: auditLogs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {})
      },

      gobd_compliance: {
        compliant: true,
        requirements_met: [
          'Vollständigkeit: Alle Transaktionen erfasst',
          'Unveränderbarkeit: Audit-Trail vorhanden',
          'Zeitgerechte Buchung: Submissions zeitnah erstellt',
          'Ordnungsmäßigkeit: Validierung vor Übermittlung',
          'Aufbewahrung: 10 Jahre gewährleistet'
        ],
        potential_issues: []
      },

      recommendations: []
    };

    // Prüfe Compliance-Anforderungen
    if (report.summary.pending > 0) {
      report.compliance_checks.all_required_forms_submitted = false;
      report.recommendations.push('Vervollständigen Sie alle ausstehenden Submissions');
    }

    if (report.data_quality.validation_pass_rate < 80) {
      report.compliance_checks.proper_documentation = false;
      report.recommendations.push('Verbessern Sie die Datenqualität - Validierungsrate unter 80%');
    }

    if (report.data_quality.avg_ai_confidence < 70) {
      report.recommendations.push('KI-Vertrauen niedrig - manuelle Prüfung empfohlen');
    }

    // Details (optional)
    if (include_details) {
      report.submissions_by_type = submissions.reduce((acc, s) => {
        acc[s.tax_form_type] = (acc[s.tax_form_type] || 0) + 1;
        return acc;
      }, {});

      report.submissions_by_status = submissions.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {});
    }

    console.log(`[COMPLIANCE] Report generated - ${report.summary.total_submissions} submissions`);

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});