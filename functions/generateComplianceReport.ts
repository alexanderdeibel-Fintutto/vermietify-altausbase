import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { year } = await req.json();
    const targetYear = year || new Date().getFullYear();

    console.log(`[COMPLIANCE] Generating report for year ${targetYear}`);

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
      tax_year: targetYear
    });

    const certificates = await base44.asServiceRole.entities.ElsterCertificate.filter({
      is_active: true
    });

    // Compliance-Checks
    const checks = {
      all_forms_submitted: {
        passed: submissions.filter(s => s.status === 'ACCEPTED').length >= submissions.length,
        score: (submissions.filter(s => s.status === 'ACCEPTED').length / (submissions.length || 1)) * 100,
        details: `${submissions.filter(s => s.status === 'ACCEPTED').length} von ${submissions.length} eingereicht`
      },
      valid_certificates: {
        passed: certificates.length > 0 && certificates.every(c => {
          const validUntil = new Date(c.valid_until);
          return validUntil > new Date();
        }),
        score: certificates.length > 0 ? 100 : 0,
        details: `${certificates.length} aktive Zertifikate`
      },
      gobd_archiving: {
        passed: submissions.filter(s => s.archived_at).length >= submissions.length * 0.8,
        score: (submissions.filter(s => s.archived_at).length / (submissions.length || 1)) * 100,
        details: `${submissions.filter(s => s.archived_at).length} von ${submissions.length} archiviert`
      },
      ai_confidence: {
        passed: submissions.every(s => !s.ai_confidence_score || s.ai_confidence_score >= 80),
        score: submissions.length > 0
          ? submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / submissions.length
          : 0,
        details: 'Durchschnittliche KI-Vertrauenswürdigkeit'
      },
      validation_clean: {
        passed: submissions.every(s => !s.validation_errors || s.validation_errors.length === 0),
        score: submissions.filter(s => !s.validation_errors || s.validation_errors.length === 0).length / (submissions.length || 1) * 100,
        details: `${submissions.filter(s => !s.validation_errors || s.validation_errors.length === 0).length} ohne Fehler`
      }
    };

    const overall_score = Object.values(checks).reduce((sum, check) => sum + check.score, 0) / Object.keys(checks).length;
    const compliance_level = overall_score >= 90 ? 'excellent' : overall_score >= 75 ? 'good' : overall_score >= 60 ? 'acceptable' : 'needs_improvement';

    const report = {
      year: targetYear,
      generated_at: new Date().toISOString(),
      generated_by: user.email,
      overall_score: Math.round(overall_score),
      compliance_level,
      checks,
      summary: {
        total_submissions: submissions.length,
        accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
        pending: submissions.filter(s => s.status === 'DRAFT' || s.status === 'VALIDATED').length,
        rejected: submissions.filter(s => s.status === 'REJECTED').length,
        archived: submissions.filter(s => s.archived_at).length
      },
      recommendations: []
    };

    // Recommendations
    if (checks.gobd_archiving.score < 100) {
      report.recommendations.push('Archivieren Sie alle Submissions gemäß GoBD-Anforderungen');
    }
    if (checks.ai_confidence.score < 80) {
      report.recommendations.push('Überprüfen Sie Submissions mit niedrigem KI-Vertrauen manuell');
    }
    if (checks.all_forms_submitted.score < 100) {
      report.recommendations.push('Reichen Sie alle ausstehenden Formulare ein');
    }

    console.log(`[SUCCESS] Compliance score: ${overall_score}%`);

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});