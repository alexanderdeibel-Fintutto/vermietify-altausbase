import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear, canton, formType } = await req.json();

    if (!taxYear || !canton || !formType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let data = [];
    let title = '';
    let columns = [];

    // Fetch data based on form type
    if (formType === 'securities') {
      data = await base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [];
      title = 'Wertschriften-Aufstellung';
      columns = ['Titel', 'Typ', 'Menge', 'Aktueller Wert CHF', 'Gesamtwert CHF', 'Dividenden CHF'];
    } else if (formType === 'real_estate') {
      data = await base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [];
      title = 'Liegenschaften-Aufstellung';
      columns = ['Adresse', 'Gemeinde', 'Marktwert CHF', 'Hypothek CHF', 'Mieteinnahmen CHF'];
    }

    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Steuerjahr: ${taxYear} | Kanton: ${canton}`, 14, 30);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-CH')}`, 14, 37);

    // Create table
    let yPosition = 45;
    const colWidth = 180 / columns.length;

    // Header
    doc.setFillColor(200, 200, 200);
    columns.forEach((col, i) => {
      doc.rect(14 + i * colWidth, yPosition, colWidth, 10, 'F');
      doc.setFontSize(9);
      doc.text(col, 14 + i * colWidth + 2, yPosition + 6);
    });

    yPosition += 10;

    // Data rows
    doc.setFontSize(9);
    data.forEach((row) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 14;
      }

      let rowData = [];
      if (formType === 'securities') {
        rowData = [
          row.title || '',
          row.investment_type || '',
          row.quantity || 0,
          (row.current_value || 0).toFixed(2),
          ((row.current_value || 0) * (row.quantity || 0)).toFixed(2),
          (row.dividend_income || 0).toFixed(2)
        ];
      } else if (formType === 'real_estate') {
        rowData = [
          row.address || '',
          row.municipality || '',
          (row.current_market_value || 0).toFixed(2),
          (row.mortgage_debt || 0).toFixed(2),
          (row.rental_income || 0).toFixed(2)
        ];
      }

      rowData.forEach((cell, i) => {
        doc.text(String(cell), 14 + i * colWidth + 2, yPosition + 6);
      });

      doc.rect(14, yPosition, 180, 10);
      yPosition += 10;
    });

    // Footer
    doc.setFontSize(8);
    doc.text('Dieses Dokument dient nur zur Information und ist nicht für die Steuererklärung gültig.', 14, 290);

    // Upload PDF
    const pdfBytes = doc.output('arraybuffer');
    const { file_url } = await base44.integrations.Core.UploadFile({ file: new Uint8Array(pdfBytes) });

    return Response.json({ file_url, status: 'success' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});