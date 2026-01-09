import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { tax_year, countries } = await req.json();

    // Alle User-Profile laden
    const profiles = await base44.asServiceRole.entities.TaxProfile.list();

    const violations = [];

    for (const profile of profiles) {
      // Check pro Land
      for (const country of profile.tax_jurisdictions) {
        // Deadline Monitoring
        const deadlines = await base44.asServiceRole.entities.TaxDeadline.filter({
          country,
          deadline_type: { $in: ['submission', 'payment', 'declaration'] }
        });

        for (const deadline of deadlines) {
          const today = new Date();
          const deadlineDate = new Date(deadline.deadline_date);
          const daysOverdue = Math.floor((today - deadlineDate) / (1000 * 60 * 60 * 24));

          if (daysOverdue > 0) {
            violations.push({
              user_email: profile.user_email,
              country,
              violation_type: 'filing_deadline_missed',
              severity: daysOverdue > 30 ? 'critical' : 'high',
              days_overdue: daysOverdue,
              deadline_title: deadline.title,
              penalty_estimate: daysOverdue * 100 // Simplified
            });
          }
        }

        // FATCA/CRS Compliance Check
        if (profile.has_international_accounts && !profile.reporting_requirements?.includes('FATCA')) {
          violations.push({
            user_email: profile.user_email,
            country,
            violation_type: 'missing_fatca_reporting',
            severity: 'critical',
            requirement: 'FATCA Form 8938 or FBAR'
          });
        }

        // Documentation Gaps
        const docs = await base44.asServiceRole.entities.TaxDocument.filter({
          user_email: profile.user_email,
          country,
          tax_year
        });

        if (docs.length === 0 && profile.profile_type !== 'simple') {
          violations.push({
            user_email: profile.user_email,
            country,
            violation_type: 'insufficient_documentation',
            severity: 'medium',
            message: 'No tax documents uploaded for this country'
          });
        }
      }
    }

    // Erstelle Alerts
    for (const violation of violations) {
      await base44.asServiceRole.entities.TaxAlert.create({
        user_email: violation.user_email,
        country: violation.country,
        alert_type: 'compliance_issue',
        title: violation.violation_type,
        message: JSON.stringify(violation),
        severity: violation.severity,
        priority: violation.severity === 'critical' ? 'critical' : 'high'
      });
    }

    return Response.json({
      total_violations: violations.length,
      violations_by_severity: {
        critical: violations.filter(v => v.severity === 'critical').length,
        high: violations.filter(v => v.severity === 'high').length,
        medium: violations.filter(v => v.severity === 'medium').length
      },
      violations
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});