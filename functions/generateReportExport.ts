import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { format_type = 'pdf', test_phase_id, include_sections = [] } = body;

    console.log('Generating report export:', { format_type, test_phase_id });

    // Fetch all relevant data
    const [analytics, insights, problems] = await Promise.all([
      base44.asServiceRole.entities.TesterAnalytics.filter({}, '-created_date', 1),
      base44.asServiceRole.entities.AIInsight.filter({ priority: { $in: ['critical', 'high'] } }, '-created_at', 20),
      base44.asServiceRole.entities.UserProblem.filter({}, '-created_date', 50)
    ]);

    const reportData = {
      generated_at: new Date().toISOString(),
      executive_summary: {
        total_testers: analytics[0]?.total_testers || 0,
        completion_rate: analytics[0]?.completion_rate || 0,
        problems_reported: analytics[0]?.problems_reported || 0,
        critical_insights: insights.filter(i => i.priority === 'critical').length
      },
      sections: {
        overview: include_sections.includes('overview') || include_sections.length === 0,
        analytics: include_sections.includes('analytics') || include_sections.length === 0,
        problems: include_sections.includes('problems') || include_sections.length === 0,
        insights: include_sections.includes('insights') || include_sections.length === 0,
        recommendations: include_sections.includes('recommendations') || include_sections.length === 0
      },
      data: {
        analytics: analytics[0],
        top_insights: insights.slice(0, 5),
        critical_problems: problems.filter(p => p.functional_severity === 'app_breaking').slice(0, 10)
      }
    };

    // For PDF, create simple HTML structure
    if (format_type === 'pdf') {
      const html = generatePDFContent(reportData);
      const pdfBase64 = Buffer.from(html).toString('base64');
      
      return Response.json({
        success: true,
        report_id: `report_${Date.now()}`,
        format: 'pdf',
        content_base64: pdfBase64,
        filename: `tester-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`
      });
    }

    // For Excel (CSV format)
    if (format_type === 'csv') {
      const csv = generateCSVContent(reportData);
      return Response.json({
        success: true,
        report_id: `report_${Date.now()}`,
        format: 'csv',
        content: csv,
        filename: `tester-analytics-report-${new Date().toISOString().split('T')[0]}.csv`
      });
    }

    // JSON format
    return Response.json({
      success: true,
      report_id: `report_${Date.now()}`,
      format: 'json',
      data: reportData,
      filename: `tester-analytics-report-${new Date().toISOString().split('T')[0]}.json`
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generatePDFContent(data) {
  return `
    <html>
      <head>
        <title>Tester Analytics Report</title>
        <style>
          body { font-family: Arial; margin: 20px; }
          h1 { color: #1e293b; }
          h2 { color: #475569; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>📊 Tester Analytics Report</h1>
        <p>Generated: ${data.generated_at}</p>
        
        <h2>Executive Summary</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Testers</td><td>${data.executive_summary.total_testers}</td></tr>
          <tr><td>Completion Rate</td><td>${data.executive_summary.completion_rate}%</td></tr>
          <tr><td>Problems Reported</td><td>${data.executive_summary.problems_reported}</td></tr>
          <tr><td>Critical Insights</td><td>${data.executive_summary.critical_insights}</td></tr>
        </table>

        <h2>Top Insights</h2>
        <ul>
          ${data.data.top_insights.map(i => `<li><strong>${i.title}</strong>: ${i.description}</li>`).join('')}
        </ul>

        <h2>Critical Problems</h2>
        <table>
          <tr><th>Title</th><th>Type</th><th>Status</th></tr>
          ${data.data.critical_problems.map(p => `
            <tr>
              <td>${p.problem_titel}</td>
              <td>${p.problem_type}</td>
              <td>${p.status}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;
}

function generateCSVContent(data) {
  let csv = 'Tester Analytics Report\n';
  csv += `Generated,${data.generated_at}\n\n`;
  
  csv += 'Executive Summary\n';
  csv += 'Metric,Value\n';
  csv += `Total Testers,${data.executive_summary.total_testers}\n`;
  csv += `Completion Rate,${data.executive_summary.completion_rate}%\n`;
  csv += `Problems Reported,${data.executive_summary.problems_reported}\n`;
  csv += `Critical Insights,${data.executive_summary.critical_insights}\n\n`;

  csv += 'Top Insights\n';
  csv += 'Title,Description,Priority\n';
  data.data.top_insights.forEach(i => {
    csv += `"${i.title}","${i.description}","${i.priority}"\n`;
  });

  return csv;
}