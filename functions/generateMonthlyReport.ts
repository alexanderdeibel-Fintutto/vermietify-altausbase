import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, month } = await req.json();

    // Fetch data
    const payments = await base44.entities.Payment.filter(
      { payment_date: { $regex: month } },
      '-payment_date',
      100
    );
    
    const expenses = await base44.entities.Invoice.filter(
      { date: { $regex: month } },
      '-date',
      100
    );

    const totalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Generate PDF
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Monatsbericht', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Zeitraum: ${month}`, 20, 35);
    
    doc.setFontSize(14);
    doc.text(`Einnahmen: ${totalIncome.toFixed(2)} €`, 20, 55);
    doc.text(`Ausgaben: ${totalExpenses.toFixed(2)} €`, 20, 65);
    doc.text(`Gewinn: ${netProfit.toFixed(2)} €`, 20, 75);

    const pdfBytes = doc.output('arraybuffer');
    
    // Upload PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], `monatsbericht_${month}.pdf`);
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    return Response.json({ pdf_url: file_url });

  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});