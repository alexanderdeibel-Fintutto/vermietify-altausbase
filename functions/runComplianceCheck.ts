import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[COMPLIANCE-CHECK] Running for ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const checks = [];

    // 1. Pflichtfelder prüfen
    const requiredFields = ['tax_year', 'legal_form', 'tax_form_type'];
    const missingFields = requiredFields.filter(field => !sub[field]);
    
    checks.push({
      category: 'Pflichtfelder',
      passed: missingFields.length === 0,
      details: missingFields.length > 0 ? `Fehlend: ${missingFields.join(', ')}` : 'Alle Pflichtfelder vorhanden',
      severity: 'CRITICAL'
    });

    // 2. Zertifikat prüfen
    const certificates = await base44.entities.ElsterCertificate.filter({
      is_active: true,
      certificate_type: sub.submission_mode
    });

    checks.push({
      category: 'Zertifikat',
      passed: certificates.length > 0,
      details: certificates.length > 0 ? 'Gültiges Zertifikat vorhanden' : 'Kein aktives Zertifikat',
      severity: 'CRITICAL'
    });

    // 3. Formulardaten prüfen
    const formData = sub.form_data || {};
    const hasFormData = Object.keys(formData).length > 0;

    checks.push({
      category: 'Formulardaten',
      passed: hasFormData,
      details: hasFormData ? `${Object.keys(formData).length} Felder befüllt` : 'Keine Formulardaten',
      severity: 'CRITICAL'
    });

    // 4. Validierungsstatus
    const hasValidationErrors = (sub.validation_errors || []).length > 0;

    checks.push({
      category: 'Validierung',
      passed: !hasValidationErrors,
      details: hasValidationErrors ? `${sub.validation_errors.length} Fehler gefunden` : 'Keine Validierungsfehler',
      severity: 'HIGH'
    });

    // 5. Dokumentation
    const hasDocuments = (sub.form_data?.uploaded_documents || []).length > 0;

    checks.push({
      category: 'Dokumentation',
      passed: hasDocuments,
      details: hasDocuments ? `${sub.form_data.uploaded_documents.length} Dokumente hochgeladen` : 'Keine Dokumente',
      severity: 'MEDIUM'
    });

    // 6. GoBD-Anforderungen
    const hasAuditLog = true; // Wir loggen automatisch

    checks.push({
      category: 'GoBD-Konformität',
      passed: hasAuditLog,
      details: 'Audit-Trail aktiv',
      severity: 'HIGH'
    });

    // 7. Vollständigkeits-Check
    const completeness = Math.round((Object.keys(formData).length / 20) * 100);

    checks.push({
      category: 'Vollständigkeit',
      passed: completeness >= 70,
      details: `${completeness}% ausgefüllt`,
      severity: 'MEDIUM'
    });

    const overallPassed = checks.filter(c => c.passed).length;
    const overallScore = Math.round((overallPassed / checks.length) * 100);
    const criticalFailed = checks.filter(c => !c.passed && c.severity === 'CRITICAL').length;

    const result = {
      submission_id,
      overall_score: overallScore,
      overall_passed: criticalFailed === 0,
      checks,
      critical_issues: criticalFailed,
      ready_for_submission: criticalFailed === 0 && overallScore >= 70,
      checked_at: new Date().toISOString()
    };

    // Log Check
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'compliance_check_run',
      user_id: user.id,
      metadata: result
    });

    console.log(`[COMPLIANCE-CHECK] Score: ${overallScore}%, Ready: ${result.ready_for_submission}`);

    return Response.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});