import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { taxYear, canton, formType } = await req.json();

    console.log(`Generating ${formType} PDF for ${canton} / ${taxYear}`);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Fetch data based on type
    let data = [];
    let formTitle = '';

    if (formType === 'securities') {
      data = await base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [];
      formTitle = 'Wertschriften & Dividenden';
    } else if (formType === 'real_estate') {
      data = await base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [];
      formTitle = 'Liegenschaften & Vermögen';
    }

    // Header
    doc.setFontSize(14);
    doc.text(formTitle, 20, 20);
    doc.setFontSize(10);
    doc.text(`Steuerjahr ${taxYear} • Kanton ${canton}`, 20, 28);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-CH')}`, 20, 34);

    // Table header
    doc.setFontSize(9);
    let yPos = 45;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7;

    doc.setFillColor(200, 200, 200);
    doc.rect(15, yPos - 5, 180, 6, 'F');

    if (formType === 'securities') {
      doc.text('Wertschrift', 20, yPos);
      doc.text('Dividenden CHF', 90, yPos);
      doc.text('Aktueller Wert', 140, yPos);
    } else if (formType === 'real_estate') {
      doc.text('Liegenschaft', 20, yPos);
      doc.text('Marktwert CHF', 100, yPos);
      doc.text('Hypothekarschuld CHF', 160, yPos);
    }

    yPos += 8;

    // Add data rows
    let totals = { value: 0, debt: 0 };
    data.forEach(item => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(8);
      if (formType === 'securities') {
        const itemValue = (item.current_value || 0) * (item.quantity || 1);
        doc.text(item.title || '', 20, yPos);
        doc.text((item.dividend_income || 0).toFixed(2), 90, yPos);
        doc.text(itemValue.toFixed(2), 140, yPos);
        totals.value += itemValue;
      } else if (formType === 'real_estate') {
        doc.text(item.title || '', 20, yPos);
        doc.text((item.current_market_value || 0).toFixed(2), 100, yPos);
        doc.text((item.mortgage_debt || 0).toFixed(2), 160, yPos);
        totals.value += item.current_market_value || 0;
        totals.debt += item.mortgage_debt || 0;
      }

      yPos += lineHeight;
    });

    // Totals
    yPos += 3;
    doc.setFillColor(220, 220, 220);
    doc.rect(15, yPos - 5, 180, 6, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');

    if (formType === 'securities') {
      doc.text('GESAMTWERT', 20, yPos);
      doc.text('', 90, yPos);
      doc.text(totals.value.toFixed(2), 140, yPos);
    } else if (formType === 'real_estate') {
      doc.text('SUMMEN', 20, yPos);
      doc.text(totals.value.toFixed(2), 100, yPos);
      doc.text(totals.debt.toFixed(2), 160, yPos);
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text('Dieses Dokument wurde automatisch erstellt. Bitte überprüfen Sie alle Angaben.', 20, pageHeight - 10);

    const pdfBytes = doc.output('arraybuffer');
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: pdfBytes
    });

    return Response.json({
      success: true,
      formType,
      canton,
      taxYear,
      file_url,
      filename: `${formType}_${canton}_${taxYear}.pdf`,
      dataCount: data.length
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});