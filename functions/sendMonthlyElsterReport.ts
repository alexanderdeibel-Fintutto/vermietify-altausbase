import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[MONTHLY-REPORT] Generating monthly ELSTER report');

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.list('-created_date', 1000);

    const monthlyData = submissions.filter(s => {
      const created = new Date(s.created_date);
      return created >= lastMonth && created < thisMonth;
    });

    const report = {
      period: `${lastMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
      summary: {
        new_submissions: monthlyData.length,
        accepted: monthlyData.filter(s => s.status === 'ACCEPTED').length,
        validated: monthlyData.filter(s => s.status === 'VALIDATED').length,
        pending: monthlyData.filter(s => s.status === 'DRAFT').length
      },
      by_form_type: {},
      avg_confidence: 0
    };

    // Group by form type
    monthlyData.forEach(sub => {
      if (!report.by_form_type[sub.tax_form_type]) {
        report.by_form_type[sub.tax_form_type] = 0;
      }
      report.by_form_type[sub.tax_form_type]++;
    });

    // Calculate average confidence
    const withConfidence = monthlyData.filter(s => s.ai_confidence_score);
    if (withConfidence.length > 0) {
      report.avg_confidence = Math.round(
        withConfidence.reduce((sum, s) => sum + s.ai_confidence_score, 0) / withConfidence.length
      );
    }

    // Send to admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

    for (const admin of admins) {
      await base44.integrations.Core.SendEmail({
        to: admin.email,
        subject: `ELSTER Monatsbericht - ${report.period}`,
        body: `
          <h2>ELSTER Monatsbericht</h2>
          <p>Zeitraum: ${report.period}</p>
          
          <h3>Zusammenfassung</h3>
          <ul>
            <li>Neue Submissions: ${report.summary.new_submissions}</li>
            <li>Akzeptiert: ${report.summary.accepted}</li>
            <li>Validiert: ${report.summary.validated}</li>
            <li>Offen: ${report.summary.pending}</li>
          </ul>

          <h3>Nach Formular-Typ</h3>
          <ul>
            ${Object.entries(report.by_form_type).map(([type, count]) => `<li>${type}: ${count}</li>`).join('')}
          </ul>

          <p>Durchschnittliches KI-Vertrauen: ${report.avg_confidence}%</p>
        `
      });
    }

    return Response.json({ success: true, report, emails_sent: admins.length });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});