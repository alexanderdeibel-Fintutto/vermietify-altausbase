import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type, params } = await req.json();

    if (!report_type) {
      return Response.json({ error: 'report_type required' }, { status: 400 });
    }

    console.log(`[TAX-REPORT] Generating ${report_type}`);

    let report = {
      type: report_type,
      generated_at: new Date().toISOString(),
      generated_by: user.email,
      data: {}
    };

    if (report_type === 'yearly_summary') {
      const year = params?.year || new Date().getFullYear() - 1;
      const submissions = await base44.entities.ElsterSubmission.filter({
        tax_year: year
      });

      report.data = {
        year,
        total_submissions: submissions.length,
        by_form_type: {},
        by_status: {},
        total_einnahmen: 0,
        total_ausgaben: 0
      };

      submissions.forEach(sub => {
        report.data.by_form_type[sub.tax_form_type] = 
          (report.data.by_form_type[sub.tax_form_type] || 0) + 1;
        report.data.by_status[sub.status] = 
          (report.data.by_status[sub.status] || 0) + 1;
        
        const formData = sub.form_data || {};
        report.data.total_einnahmen += parseFloat(formData.einnahmen_gesamt || 0);
        report.data.total_ausgaben += parseFloat(formData.werbungskosten_gesamt || 0);
      });

      report.data.nettoertrag = report.data.total_einnahmen - report.data.total_ausgaben;

    } else if (report_type === 'compliance_overview') {
      const submissions = await base44.entities.ElsterSubmission.list('-created_date', 100);
      
      report.data = {
        total_submissions: submissions.length,
        compliant: submissions.filter(s => 
          s.status === 'ACCEPTED' && s.archived_at
        ).length,
        missing_pdf: submissions.filter(s => !s.pdf_url).length,
        validation_errors: submissions.filter(s => 
          s.validation_errors && s.validation_errors.length > 0
        ).length,
        low_confidence: submissions.filter(s => 
          s.ai_confidence_score < 70
        ).length
      };

      report.data.compliance_rate = report.data.total_submissions > 0
        ? Math.round((report.data.compliant / report.data.total_submissions) * 100)
        : 0;
    }

    console.log(`[TAX-REPORT] Generated ${report_type}`);

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});