import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type, year } = await req.json();

    // Lade relevante Daten
    const submissions = await base44.entities.ElsterSubmission.filter({ tax_year: year });
    const financialItems = await base44.entities.FinancialItem.filter({
      created_date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` }
    });

    const doc = new jsPDF();
    let yPos = 20;

    // Titel
    doc.setFontSize(20);
    doc.text(getReportTitle(report_type), 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Jahr: ${year}`, 20, yPos);
    yPos += 10;
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 20, yPos);
    yPos += 15;

    // Report-spezifischer Content
    switch (report_type) {
      case 'yearly-summary':
        yPos = addYearlySummary(doc, yPos, submissions, financialItems);
        break;
      case 'tax-advisor':
        yPos = addTaxAdvisorReport(doc, yPos, submissions, financialItems);
        break;
      case 'income-analysis':
        yPos = addIncomeAnalysis(doc, yPos, financialItems);
        break;
      case 'expense-breakdown':
        yPos = addExpenseBreakdown(doc, yPos, financialItems);
        break;
      default:
        doc.text('Report-Typ nicht unterstützt', 20, yPos);
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report_type}-${year}.pdf"`
      }
    });

  } catch (error) {
    console.error('Generate Tax Report Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getReportTitle(type) {
  const titles = {
    'yearly-summary': 'Jahresübersicht',
    'tax-advisor': 'Steuerberater-Report',
    'income-analysis': 'Einnahmen-Analyse',
    'expense-breakdown': 'Ausgaben-Aufstellung',
    'afa-schedule': 'AfA-Plan',
    'compliance-report': 'Compliance-Bericht'
  };
  return titles[type] || 'Steuer-Report';
}

function addYearlySummary(doc, yPos, submissions, financialItems) {
  doc.setFontSize(14);
  doc.text('Übersicht', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Anzahl Einreichungen: ${submissions.length}`, 20, yPos);
  yPos += 7;

  const totalIncome = financialItems
    .filter(i => i.type === 'income')
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  
  const totalExpense = financialItems
    .filter(i => i.type === 'expense')
    .reduce((sum, i) => sum + (Math.abs(i.amount) || 0), 0);

  doc.text(`Gesamteinnahmen: ${totalIncome.toFixed(2)} €`, 20, yPos);
  yPos += 7;
  doc.text(`Gesamtausgaben: ${totalExpense.toFixed(2)} €`, 20, yPos);
  yPos += 7;
  doc.text(`Überschuss: ${(totalIncome - totalExpense).toFixed(2)} €`, 20, yPos);
  yPos += 15;

  return yPos;
}

function addTaxAdvisorReport(doc, yPos, submissions, financialItems) {
  doc.setFontSize(14);
  doc.text('Steuerberater-Informationen', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text('Dieser Report enthält alle relevanten Informationen für die Steuererklärung.', 20, yPos);
  yPos += 10;

  // Submissions
  submissions.forEach((sub, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(`${idx + 1}. ${sub.tax_form_type} - Status: ${sub.status}`, 20, yPos);
    yPos += 7;
  });

  return yPos;
}

function addIncomeAnalysis(doc, yPos, financialItems) {
  doc.setFontSize(14);
  doc.text('Einnahmen-Analyse', 20, yPos);
  yPos += 10;

  const incomeItems = financialItems.filter(i => i.type === 'income');
  
  doc.setFontSize(10);
  incomeItems.forEach((item, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(
      `${item.description || 'Einnahme'}: ${(item.amount || 0).toFixed(2)} €`,
      20,
      yPos
    );
    yPos += 7;
  });

  return yPos;
}

function addExpenseBreakdown(doc, yPos, financialItems) {
  doc.setFontSize(14);
  doc.text('Ausgaben-Aufstellung', 20, yPos);
  yPos += 10;

  const expenseItems = financialItems.filter(i => i.type === 'expense');
  
  doc.setFontSize(10);
  expenseItems.forEach((item, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(
      `${item.description || 'Ausgabe'}: ${Math.abs(item.amount || 0).toFixed(2)} €`,
      20,
      yPos
    );
    yPos += 7;
  });

  return yPos;
}