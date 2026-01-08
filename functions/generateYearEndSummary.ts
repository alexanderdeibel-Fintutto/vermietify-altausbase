import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year } = await req.json();
    const targetYear = year || new Date().getFullYear() - 1;

    console.log(`[YEAR-END] Generating summary for ${targetYear}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: targetYear
    });

    const prevYearSubmissions = await base44.entities.ElsterSubmission.filter({
      tax_year: targetYear - 1
    });

    const summary = {
      year: targetYear,
      generated_at: new Date().toISOString(),
      total_submissions: submissions.length,
      accepted_count: submissions.filter(s => s.status === 'ACCEPTED').length,
      rejected_count: submissions.filter(s => s.status === 'REJECTED').length,
      pending_count: submissions.filter(s => ['DRAFT', 'VALIDATED', 'SUBMITTED'].includes(s.status)).length,
      
      by_form_type: submissions.reduce((acc, s) => {
        acc[s.tax_form_type] = (acc[s.tax_form_type] || 0) + 1;
        return acc;
      }, {}),

      total_revenue: 0,
      total_expenses: 0,
      net_result: 0,

      avg_ai_confidence: Math.round(
        submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / 
        (submissions.length || 1)
      ),

      compliance_rate: Math.round(
        submissions.filter(s => s.status === 'ACCEPTED').length /
        (submissions.length || 1) * 100
      )
    };

    // Berechne Finanzkennzahlen aus form_data
    submissions.forEach(s => {
      if (s.form_data) {
        summary.total_revenue += parseFloat(s.form_data.einnahmen_gesamt || 0);
        summary.total_expenses += parseFloat(s.form_data.ausgaben_gesamt || 0);
      }
    });

    summary.net_result = summary.total_revenue - summary.total_expenses;

    // Jahresvergleich
    if (prevYearSubmissions.length > 0) {
      const prevRevenue = prevYearSubmissions.reduce((sum, s) => 
        sum + parseFloat(s.form_data?.einnahmen_gesamt || 0), 0
      );

      const change = prevRevenue > 0 
        ? Math.round(((summary.total_revenue - prevRevenue) / prevRevenue) * 100)
        : 0;

      summary.year_over_year = {
        prev_year: targetYear - 1,
        prev_revenue: prevRevenue,
        change
      };
    }

    console.log(`[YEAR-END] Summary generated: ${summary.total_submissions} submissions`);

    return Response.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});