import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year, include_raw_data = false } = await req.json();
    const targetYear = year || new Date().getFullYear() - 1;

    console.log(`[TAX-ADVISOR-REPORT] Generating report for ${targetYear}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: targetYear
    });

    const report = {
      report_title: `Steuerberater-Report ${targetYear}`,
      generated_at: new Date().toISOString(),
      generated_by: user.full_name,
      year: targetYear,
      
      executive_summary: {
        total_submissions: submissions.length,
        accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
        pending_review: submissions.filter(s => ['DRAFT', 'VALIDATED'].includes(s.status)).length,
        issues_found: submissions.filter(s => s.validation_errors?.length > 0).length
      },

      submissions_by_type: {},
      
      data_quality_metrics: {
        avg_confidence: Math.round(
          submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / 
          (submissions.length || 1)
        ),
        manual_review_required: submissions.filter(s => 
          (s.ai_confidence_score || 0) < 70 || 
          (s.validation_errors?.length || 0) > 0
        ).length
      },

      timeline: [],

      recommendations: [],

      contact_info: {
        client_name: user.full_name,
        client_email: user.email,
        report_date: new Date().toLocaleDateString('de-DE')
      }
    };

    // Gruppiere nach Formular-Typ
    submissions.forEach(sub => {
      if (!report.submissions_by_type[sub.tax_form_type]) {
        report.submissions_by_type[sub.tax_form_type] = {
          count: 0,
          total_revenue: 0,
          total_expenses: 0,
          net_result: 0,
          submissions: []
        };
      }

      const typeData = report.submissions_by_type[sub.tax_form_type];
      typeData.count++;
      
      if (sub.form_data) {
        typeData.total_revenue += parseFloat(sub.form_data.einnahmen_gesamt || 0);
        typeData.total_expenses += parseFloat(sub.form_data.ausgaben_gesamt || 0);
      }

      typeData.submissions.push({
        id: sub.id,
        status: sub.status,
        building_id: sub.building_id,
        submission_date: sub.submission_date,
        ai_confidence: sub.ai_confidence_score
      });
    });

    // Timeline
    report.timeline = submissions
      .filter(s => s.submission_date)
      .sort((a, b) => new Date(a.submission_date) - new Date(b.submission_date))
      .map(s => ({
        date: s.submission_date,
        type: s.tax_form_type,
        status: s.status
      }));

    // Empfehlungen
    if (report.data_quality_metrics.manual_review_required > 0) {
      report.recommendations.push(
        `${report.data_quality_metrics.manual_review_required} Submissions benötigen manuelle Prüfung`
      );
    }

    if (report.executive_summary.pending_review > 0) {
      report.recommendations.push(
        `${report.executive_summary.pending_review} Submissions sind noch nicht eingereicht`
      );
    }

    if (include_raw_data) {
      report.raw_submissions = submissions;
    }

    console.log(`[TAX-ADVISOR-REPORT] Generated for ${submissions.length} submissions`);

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});