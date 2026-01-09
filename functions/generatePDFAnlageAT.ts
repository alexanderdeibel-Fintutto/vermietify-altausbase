import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { taxYear, anlageType } = await req.json();

    console.log(`Generating ${anlageType} PDF for ${taxYear}`);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Fetch data based on type
    let data = [];
    if (anlageType === 'KAP') {
      data = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
    } else if (anlageType === 'SO') {
      data = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
    } else if (anlageType === 'E1c') {
      data = await base44.entities.RealEstate.filter({ tax_year: taxYear }) || [];
    }

    // Header
    doc.setFontSize(14);
    doc.text(`Anlage ${anlageType}`, 20, 20);
    doc.setFontSize(10);
    doc.text(`Steuerjahr ${taxYear}`, 20, 28);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-AT')}`, 20, 34);

    // Table header
    doc.setFontSize(9);
    let yPos = 45;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7;

    doc.setFillColor(200, 200, 200);
    doc.rect(15, yPos - 5, 180, 6, 'F');

    if (anlageType === 'KAP') {
      doc.text('Beschreibung', 20, yPos);
      doc.text('Ertrag €', 100, yPos);
      doc.text('KESt €', 140, yPos);
      doc.text('Netto €', 170, yPos);
    } else if (anlageType === 'SO') {
      doc.text('Beschreibung', 20, yPos);
      doc.text('Betrag €', 100, yPos);
      doc.text('Art', 140, yPos);
    } else if (anlageType === 'E1c') {
      doc.text('Objekt', 20, yPos);
      doc.text('Mieteinnahmen €', 100, yPos);
      doc.text('Werbungskosten €', 140, yPos);
    }

    yPos += 8;

    // Add data rows
    let totals = { income: 0, tax: 0 };
    data.forEach(item => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(8);
      if (anlageType === 'KAP') {
        doc.text(item.title || '', 20, yPos);
        doc.text(item.gross_income.toFixed(2), 100, yPos);
        doc.text((item.withheld_tax_kest || 0).toFixed(2), 140, yPos);
        doc.text((item.gross_income - (item.withheld_tax_kest || 0)).toFixed(2), 170, yPos);
        totals.income += item.gross_income;
        totals.tax += item.withheld_tax_kest || 0;
      } else if (anlageType === 'SO') {
        doc.text(item.description || '', 20, yPos);
        doc.text(item.amount.toFixed(2), 100, yPos);
        doc.text(item.income_type || '', 140, yPos);
        totals.income += item.amount;
      } else if (anlageType === 'E1c') {
        doc.text(item.title || '', 20, yPos);
        doc.text(item.rental_income?.toFixed(2) || '0.00', 100, yPos);
        doc.text((item.maintenance_costs || 0).toFixed(2), 140, yPos);
        totals.income += item.rental_income || 0;
      }

      yPos += lineHeight;
    });

    // Totals
    yPos += 3;
    doc.setFillColor(220, 220, 220);
    doc.rect(15, yPos - 5, 180, 6, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');

    if (anlageType === 'KAP') {
      doc.text('SUMME', 20, yPos);
      doc.text(totals.income.toFixed(2), 100, yPos);
      doc.text(totals.tax.toFixed(2), 140, yPos);
      doc.text((totals.income - totals.tax).toFixed(2), 170, yPos);
    } else {
      doc.text('SUMME', 20, yPos);
      doc.text(totals.income.toFixed(2), 100, yPos);
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text('Dieses Dokument wurde automatisch generiert und ist ohne Unterschrift nicht gültig.', 20, pageHeight - 10);

    const pdfBytes = doc.output('arraybuffer');
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: pdfBytes
    });

    return Response.json({
      success: true,
      anlageType,
      taxYear,
      file_url,
      filename: `Anlage_${anlageType}_${taxYear}.pdf`,
      dataCount: data.length
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});