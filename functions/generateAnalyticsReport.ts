import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year } = await req.json();

    console.log(`[ANALYTICS] Generating report for ${year}`);

    const submissions = await base44.entities.ElsterSubmission.filter({ tax_year: year });

    const report = {
      year,
      generated_at: new Date().toISOString(),
      overview: {
        total_submissions: submissions.length,
        by_status: {},
        by_form_type: {},
        by_legal_form: {}
      },
      performance: {
        avg_confidence: 0,
        acceptance_rate: 0,
        validation_success_rate: 0
      },
      timeline: [],
      top_errors: [],
      recommendations: []
    };

    // Status distribution
    submissions.forEach(sub => {
      report.overview.by_status[sub.status] = (report.overview.by_status[sub.status] || 0) + 1;
      report.overview.by_form_type[sub.tax_form_type] = (report.overview.by_form_type[sub.tax_form_type] || 0) + 1;
      report.overview.by_legal_form[sub.legal_form] = (report.overview.by_legal_form[sub.legal_form] || 0) + 1;
    });

    // Performance metrics
    const withConfidence = submissions.filter(s => s.ai_confidence_score);
    if (withConfidence.length > 0) {
      report.performance.avg_confidence = Math.round(
        withConfidence.reduce((sum, s) => sum + s.ai_confidence_score, 0) / withConfidence.length
      );
    }

    const accepted = submissions.filter(s => s.status === 'ACCEPTED').length;
    report.performance.acceptance_rate = submissions.length > 0 
      ? Math.round((accepted / submissions.length) * 100) 
      : 0;

    const validated = submissions.filter(s => s.status === 'VALIDATED' || s.status === 'ACCEPTED').length;
    report.performance.validation_success_rate = submissions.length > 0
      ? Math.round((validated / submissions.length) * 100)
      : 0;

    // Timeline (monthly breakdown)
    const months = {};
    submissions.forEach(sub => {
      const month = new Date(sub.created_date).toLocaleDateString('de-DE', { month: 'short' });
      months[month] = (months[month] || 0) + 1;
    });
    report.timeline = Object.entries(months).map(([month, count]) => ({ month, count }));

    // Top errors
    const errorCounts = {};
    submissions.forEach(sub => {
      if (sub.validation_errors?.length > 0) {
        sub.validation_errors.forEach(err => {
          const msg = err.message || JSON.stringify(err);
          errorCounts[msg] = (errorCounts[msg] || 0) + 1;
        });
      }
    });
    report.top_errors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    // Recommendations
    if (report.performance.acceptance_rate < 80) {
      report.recommendations.push('Akzeptanzrate unter 80% - Validierung verbessern');
    }
    if (report.performance.avg_confidence < 85) {
      report.recommendations.push('KI-Vertrauen unter 85% - mehr Trainingsdaten sammeln');
    }
    if (report.top_errors.length > 3) {
      report.recommendations.push('Häufige Fehler identifiziert - automatische Korrektur implementieren');
    }

    return Response.json({ success: true, report });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});