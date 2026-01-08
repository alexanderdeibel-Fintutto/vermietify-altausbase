import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();

    if (!tax_year) {
      return Response.json({ error: 'tax_year required' }, { status: 400 });
    }

    console.log(`[COMPLIANCE-AUDIT] Running for year ${tax_year}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year
    });

    const audit = {
      year: tax_year,
      audit_date: new Date().toISOString(),
      total_submissions: submissions.length,
      checks: [],
      violations: [],
      warnings: [],
      passed: true
    };

    // Check 1: Alle Formulare eingereicht?
    const requiredForms = ['ANLAGE_V']; // Anpassen je nach Bedarf
    requiredForms.forEach(formType => {
      const found = submissions.some(s => s.tax_form_type === formType);
      if (!found) {
        audit.violations.push({
          check: 'required_forms',
          severity: 'HIGH',
          message: `Pflichtformular ${formType} fehlt für ${tax_year}`
        });
        audit.passed = false;
      }
    });

    // Check 2: GoBD-Archivierung
    const unarchived = submissions.filter(s => 
      s.status === 'ACCEPTED' && !s.archived_at
    );
    if (unarchived.length > 0) {
      audit.warnings.push({
        check: 'gobd_archiving',
        severity: 'MEDIUM',
        message: `${unarchived.length} akzeptierte Submissions noch nicht GoBD-archiviert`,
        affected_ids: unarchived.map(s => s.id)
      });
    }

    // Check 3: Dokumentation vollständig?
    const missingDocs = submissions.filter(s => !s.pdf_url);
    if (missingDocs.length > 0) {
      audit.warnings.push({
        check: 'documentation',
        severity: 'MEDIUM',
        message: `${missingDocs.length} Submissions ohne PDF-Dokumentation`
      });
    }

    // Check 4: Audit-Trail vorhanden?
    for (const sub of submissions) {
      const logs = await base44.entities.ActivityLog.filter({
        entity_type: 'ElsterSubmission',
        entity_id: sub.id
      });

      if (logs.length === 0) {
        audit.violations.push({
          check: 'audit_trail',
          severity: 'HIGH',
          message: `Kein Audit-Trail für Submission ${sub.id}`,
          submission_id: sub.id
        });
        audit.passed = false;
      }
    }

    // Check 5: Fristen eingehalten?
    const deadline = new Date(tax_year + 1, 6, 31); // 31. Juli des Folgejahres
    const lateSubmissions = submissions.filter(s => {
      if (s.submission_date) {
        return new Date(s.submission_date) > deadline;
      }
      return false;
    });

    if (lateSubmissions.length > 0) {
      audit.violations.push({
        check: 'deadlines',
        severity: 'HIGH',
        message: `${lateSubmissions.length} Submissions nach Frist eingereicht`
      });
    }

    audit.checks = [
      { name: 'required_forms', passed: audit.violations.every(v => v.check !== 'required_forms') },
      { name: 'gobd_archiving', passed: audit.warnings.every(w => w.check !== 'gobd_archiving') },
      { name: 'documentation', passed: audit.warnings.every(w => w.check !== 'documentation') },
      { name: 'audit_trail', passed: audit.violations.every(v => v.check !== 'audit_trail') },
      { name: 'deadlines', passed: audit.violations.every(v => v.check !== 'deadlines') }
    ];

    console.log(`[COMPLIANCE-AUDIT] Found ${audit.violations.length} violations, ${audit.warnings.length} warnings`);

    return Response.json({
      success: true,
      audit,
      compliance_score: Math.round(
        (audit.checks.filter(c => c.passed).length / audit.checks.length) * 100
      )
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});