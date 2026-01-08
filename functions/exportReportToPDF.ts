import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { summary_id } = await req.json();

    // Summary laden
    const summaries = await base44.entities.ProblemReportSummary.filter({ id: summary_id });
    if (summaries.length === 0) {
      return Response.json({ error: 'Summary not found' }, { status: 404 });
    }
    const summary = summaries[0];

    const doc = new jsPDF();
    let yPos = 20;

    // Titel
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Problem Report Summary', 20, yPos);
    yPos += 10;

    // Zeitraum
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${new Date(summary.date_from).toLocaleDateString('de-DE')} - ${new Date(summary.date_to).toLocaleDateString('de-DE')}`, 20, yPos);
    yPos += 10;
    doc.text(`Type: ${summary.summary_type}`, 20, yPos);
    yPos += 15;

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Reports: ${summary.total_reports}`, 25, yPos);
    yPos += 6;
    doc.text(`P1 Critical: ${summary.reports_by_priority?.p1 || 0}`, 25, yPos);
    yPos += 6;
    doc.text(`P2 High: ${summary.reports_by_priority?.p2 || 0}`, 25, yPos);
    yPos += 6;
    doc.text(`P3 Medium: ${summary.reports_by_priority?.p3 || 0}`, 25, yPos);
    yPos += 6;
    doc.text(`P4 Low: ${summary.reports_by_priority?.p4 || 0}`, 25, yPos);
    yPos += 12;

    // Business Impact
    if (summary.revenue_blocking_issues?.length > 0 || summary.compliance_risk_issues?.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Critical Business Impact', 20, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      if (summary.revenue_blocking_issues?.length > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Revenue Blocking: ${summary.revenue_blocking_issues.length} issues`, 25, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
      }
      if (summary.compliance_risk_issues?.length > 0) {
        doc.setTextColor(234, 88, 12);
        doc.text(`Compliance Risk: ${summary.compliance_risk_issues.length} issues`, 25, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
      }
      yPos += 8;
    }

    // Top Problem Areas
    if (summary.top_problem_areas?.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Problem Areas', 20, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      summary.top_problem_areas.slice(0, 5).forEach((area, idx) => {
        doc.text(`${idx + 1}. ${area.area}: ${area.count} reports (${area.percentage}%)`, 25, yPos);
        yPos += 6;
      });
      yPos += 10;
    }

    // Immediate Actions
    if (summary.immediate_actions_needed?.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Immediate Actions Required', 20, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      summary.immediate_actions_needed.forEach((action, idx) => {
        const actionText = doc.splitTextToSize(`${idx + 1}. ${action.action} (Priority: ${action.priority})`, 170);
        doc.text(actionText, 25, yPos);
        yPos += actionText.length * 6 + 4;
      });
      yPos += 10;
    }

    // Stakeholder Summary
    if (summary.stakeholder_summary) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Management Summary', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(summary.stakeholder_summary, 170);
      summaryLines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 25, yPos);
        yPos += 5;
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generated: ${new Date().toLocaleString('de-DE')} | Page ${i} of ${pageCount}`, 20, 285);
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=report-${summary.summary_type}-${Date.now()}.pdf`
      }
    });

  } catch (error) {
    console.error('Error exporting PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});