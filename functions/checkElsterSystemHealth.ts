import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[HEALTH-CHECK] Starting ELSTER system health check');

    const health = {
      status: 'healthy',
      checks: {},
      timestamp: new Date().toISOString()
    };

    // Check 1: Certificates
    const certificates = await base44.entities.ElsterCertificate.filter({ is_active: true });
    const now = new Date();
    const validCerts = certificates.filter(c => new Date(c.valid_until) > now);

    health.checks.certificates = {
      status: validCerts.length > 0 ? 'healthy' : 'critical',
      total: certificates.length,
      valid: validCerts.length,
      expired: certificates.length - validCerts.length,
      message: validCerts.length > 0 
        ? `${validCerts.length} gültige Zertifikate` 
        : 'Keine gültigen Zertifikate vorhanden'
    };

    // Check 2: Recent submissions
    const submissions = await base44.entities.ElsterSubmission.list('-created_date', 100);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubmissions = submissions.filter(s => new Date(s.created_date) > last30Days);

    health.checks.submissions = {
      status: 'healthy',
      total: submissions.length,
      recent: recentSubmissions.length,
      accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
      message: `${recentSubmissions.length} Submissions in den letzten 30 Tagen`
    };

    // Check 3: Templates
    const templates = await base44.entities.ElsterFormTemplate.filter({ is_active: true });
    health.checks.templates = {
      status: templates.length > 0 ? 'healthy' : 'warning',
      total: templates.length,
      message: templates.length > 0 
        ? `${templates.length} aktive Templates` 
        : 'Keine Templates konfiguriert'
    };

    // Check 4: Failed submissions
    const failedSubmissions = submissions.filter(s => 
      s.status === 'REJECTED' && new Date(s.created_date) > last30Days
    );

    health.checks.failures = {
      status: failedSubmissions.length > 5 ? 'warning' : 'healthy',
      count: failedSubmissions.length,
      message: failedSubmissions.length > 5 
        ? `${failedSubmissions.length} abgelehnte Submissions in 30 Tagen` 
        : 'Keine kritischen Fehler'
    };

    // Check 5: Validation issues
    const validationIssues = submissions.filter(s => 
      s.validation_errors && s.validation_errors.length > 0
    ).length;

    health.checks.validation = {
      status: validationIssues > 10 ? 'warning' : 'healthy',
      issues: validationIssues,
      message: `${validationIssues} Submissions mit Validierungsfehlern`
    };

    // Overall status
    const criticalChecks = Object.values(health.checks).filter(c => c.status === 'critical');
    const warningChecks = Object.values(health.checks).filter(c => c.status === 'warning');

    if (criticalChecks.length > 0) {
      health.status = 'critical';
    } else if (warningChecks.length > 0) {
      health.status = 'warning';
    }

    console.log(`[SUCCESS] Health status: ${health.status}`);

    return Response.json({
      success: true,
      health
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ 
      success: false,
      health: {
        status: 'critical',
        checks: {
          system: {
            status: 'critical',
            message: error.message
          }
        }
      }
    }, { status: 500 });
  }
});