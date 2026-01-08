import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[HEALTH] Generating system health report');

    const [submissions, certificates, categories] = await Promise.all([
      base44.entities.ElsterSubmission.list(),
      base44.entities.ElsterCertificate.list(),
      base44.entities.TaxCategoryMaster.list()
    ]);

    const health = {
      overall_score: 100,
      issues: [],
      warnings: [],
      metrics: {}
    };

    // Certificate health
    const activeCerts = certificates.filter(c => c.is_active);
    const expiringSoon = activeCerts.filter(c => {
      const daysUntilExpiry = Math.ceil((new Date(c.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry < 60;
    });

    health.metrics.certificates = {
      total: certificates.length,
      active: activeCerts.length,
      expiring_soon: expiringSoon.length
    };

    if (expiringSoon.length > 0) {
      health.warnings.push(`${expiringSoon.length} Zertifikat(e) laufen in < 60 Tagen ab`);
      health.overall_score -= 10;
    }

    // Submission health
    const errorSubmissions = submissions.filter(s => s.validation_errors?.length > 0);
    const lowConfidence = submissions.filter(s => s.ai_confidence_score && s.ai_confidence_score < 70);

    health.metrics.submissions = {
      total: submissions.length,
      with_errors: errorSubmissions.length,
      low_confidence: lowConfidence.length
    };

    if (errorSubmissions.length > submissions.length * 0.2) {
      health.issues.push(`Hohe Fehlerrate: ${errorSubmissions.length}/${submissions.length} Submissions`);
      health.overall_score -= 20;
    }

    // Category health
    health.metrics.categories = {
      total: categories.length,
      active: categories.filter(c => c.is_active).length
    };

    if (categories.length < 10) {
      health.warnings.push('Wenige Kategorien geladen');
      health.overall_score -= 5;
    }

    health.overall_score = Math.max(0, health.overall_score);
    health.status = health.overall_score >= 80 ? 'healthy' : health.overall_score >= 60 ? 'warning' : 'critical';

    console.log(`[HEALTH] Score: ${health.overall_score}`);

    return Response.json({ success: true, health });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});