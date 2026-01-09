import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { calculationId, country, taxYear, canton } = await req.json();

    if (!calculationId || !country || !taxYear) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch calculation
    const calculations = await base44.entities.TaxCalculation.filter({ id: calculationId }) || [];
    const calculation = calculations[0];

    if (!calculation) {
      return Response.json({ error: 'Calculation not found' }, { status: 404 });
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.text(`Steuerbericht ${country}`, margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Steuerjahr: ${taxYear}`, margin, yPos);
    yPos += 5;
    if (canton) {
      doc.text(`Kanton: ${canton}`, margin, yPos);
      yPos += 5;
    }
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, margin, yPos);
    doc.text(`Benutzer: ${user.email}`, pageWidth - margin - 40, yPos);
    yPos += 15;

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('📊 ZUSAMMENFASSUNG', margin, yPos);
    yPos += 8;

    // Summary Box
    doc.setDrawColor(100, 150, 200);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 35);
    yPos += 3;

    doc.setFontSize(10);
    const summaryLines = [
      [`Gesamtsteuerbetrag:`, `€${(calculation.total_tax || 0).toLocaleString('de-DE')}`],
      [`Gezahlte Vorauszahlungen:`, `€${(calculation.withholding_tax_paid || 0).toLocaleString('de-DE')}`],
      [`Rückerstattung / Nachzahlung:`, `€${(calculation.tax_refund_or_payment || 0).toLocaleString('de-DE')}`]
    ];

    summaryLines.forEach(([label, value]) => {
      doc.text(label, margin + 4, yPos);
      doc.text(value, pageWidth - margin - 40, yPos, { align: 'right' });
      yPos += 7;
    });

    yPos += 10;

    // Detailed Breakdown
    doc.setFontSize(12);
    doc.text('📋 DETAILLIERTE AUFSCHLÜSSELUNG', margin, yPos);
    yPos += 8;

    const calcData = calculation.calculation_data || {};
    
    if (calcData.breakdown) {
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      
      Object.entries(calcData.breakdown).forEach(([key, value]) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        const label = key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1);
        doc.text(`${label}:`, margin + 4, yPos);
        doc.text(`€${(value || 0).toLocaleString('de-DE')}`, pageWidth - margin - 40, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    yPos += 10;

    // Income Components
    if (calcData.income_components) {
      doc.setFontSize(12);
      doc.text('💰 EINKOMMEN', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      
      Object.entries(calcData.income_components).forEach(([key, value]) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        const label = key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1);
        doc.text(`${label}:`, margin + 4, yPos);
        doc.text(`€${(value || 0).toLocaleString('de-DE')}`, pageWidth - margin - 40, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    yPos += 10;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Dieser Bericht dient nur zu Informationszwecken. Für die Steuererklärung konsultieren Sie bitte einen Steuerberater.',
      margin,
      pageHeight - 10
    );

    // Generate and upload PDF
    const pdfBytes = doc.output('arraybuffer');
    const { file_url } = await base44.integrations.Core.UploadFile({ 
      file: new Uint8Array(pdfBytes)
    });

    // Save calculation as PDF
    await base44.entities.TaxCalculation.update(calculationId, {
      status: 'calculated'
    });

    return Response.json({ 
      file_url,
      status: 'success'
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});