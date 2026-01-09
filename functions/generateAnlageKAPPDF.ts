import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { calculation_id, tax_year } = await req.json();

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const calculation = await base44.asServiceRole.entities.TaxCalculation.list(
      undefined,
      1,
      { id: calculation_id }
    );

    if (!calculation || calculation.length === 0) {
      return Response.json({ error: 'Calculation not found' }, { status: 404 });
    }

    const calc = calculation[0];
    const fields = calc.calculated_fields || {};

    // Create PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;

    // Helper function for text
    const addText = (text, x, y, options = {}) => {
      doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
      doc.setFontSize(options.size || 11);
      doc.text(text, x, y);
    };

    const addLine = () => {
      yPos += 2;
      doc.setDrawColor(200);
      doc.line(10, yPos, pageWidth - 10, yPos);
      yPos += 3;
    };

    // Header
    addText('Anlage KAP - Kapitalerträge', 15, yPos, { bold: true, size: 14 });
    yPos += 10;
    addText(`Steuerjahr: ${tax_year}`, 15, yPos);
    yPos += 8;
    addText(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 15, yPos);
    addLine();

    // Section 1: Einkünfte
    yPos += 2;
    addText('1. KAPITALERTRÄGE', 15, yPos, { bold: true, size: 12 });
    yPos += 8;

    const data = [
      ['Zinsen (Zeile 7)', `€ ${(fields.zeile_7_zinsen || 0).toFixed(2)}`],
      ['Dividenden (Zeile 9)', `€ ${(fields.zeile_9_dividenden || 0).toFixed(2)}`],
      ['Wertpapiergewinne (Zeile 12)', `€ ${(fields.zeile_12_wertpapiergewinne || 0).toFixed(2)}`],
      ['Steuerabzug (Zeile 37)', `€ ${(fields.zeile_37_steuerabzug || 0).toFixed(2)}`],
    ];

    data.forEach(([label, value]) => {
      addText(label, 20, yPos);
      addText(value, pageWidth - 30, yPos, { bold: true });
      yPos += 7;
    });

    addLine();

    // Section 2: Verluste
    yPos += 2;
    addText('2. VERLUSTE', 15, yPos, { bold: true, size: 12 });
    yPos += 8;
    addText('Verluste (Zeile 26)', 20, yPos);
    addText(`€ ${(fields.zeile_26_verluste || 0).toFixed(2)}`, pageWidth - 30, yPos, { bold: true });
    yPos += 8;

    addLine();

    // Section 3: Sparer-Pauschbetrag
    yPos += 2;
    addText('3. SPARER-PAUSCHBETRAG', 15, yPos, { bold: true, size: 12 });
    yPos += 8;
    addText(`Genutzter Pauschbetrag (Zeile 16): € ${calc.sparer_pauschbetrag_used || 0}`, 20, yPos);
    yPos += 7;
    addText(`Verbleibender Pauschbetrag: € ${calc.sparer_pauschbetrag_remaining || 1000}`, 20, yPos);

    yPos += 10;
    addLine();

    // Section 4: Zusammenfassung
    yPos += 2;
    addText('4. STEUERERGEBNIS', 15, yPos, { bold: true, size: 12 });
    yPos += 8;

    const totalGains = (fields.zeile_7_zinsen || 0) + 
                       (fields.zeile_9_dividenden || 0) + 
                       (fields.zeile_12_wertpapiergewinne || 0);
    const taxableGains = Math.max(0, totalGains - (calc.sparer_pauschbetrag_used || 0));
    const estimatedTax = taxableGains * 0.25;

    addText('Gesamte Kapitalerträge:', 20, yPos);
    addText(`€ ${totalGains.toFixed(2)}`, pageWidth - 30, yPos, { bold: true });
    yPos += 7;

    addText('Steuerpflichtiger Betrag:', 20, yPos);
    addText(`€ ${taxableGains.toFixed(2)}`, pageWidth - 30, yPos, { bold: true });
    yPos += 7;

    addText('Geschätzte Abgeltungsteuer (25%):', 20, yPos);
    addText(`€ ${estimatedTax.toFixed(2)}`, pageWidth - 30, yPos, { bold: true, size: 12 });

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Anlage_KAP_${tax_year}.pdf"`
      }
    });
  } catch (error) {
    console.error('generateAnlageKAPPDF error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});