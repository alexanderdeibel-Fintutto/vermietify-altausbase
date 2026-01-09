import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { portfolio, format = 'pdf' } = body;

    if (!portfolio || portfolio.length === 0) {
      return Response.json({ error: 'Portfolio ist leer' }, { status: 400 });
    }

    const totalValue = portfolio.reduce((sum, p) => sum + (p.quantity * p.current_value), 0);
    const totalInvested = portfolio.reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0);
    const totalGain = totalValue - totalInvested;
    const gainPercent = (totalGain / totalInvested) * 100;

    if (format === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Portfolio-Bericht', 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);
      doc.text(`Benutzer: ${user.full_name}`, 20, 36);

      // Summary
      doc.setFontSize(12);
      doc.text('Zusammenfassung', 20, 50);
      
      doc.setFontSize(10);
      doc.text(`Gesamtwert: €${totalValue.toFixed(2)}`, 20, 58);
      doc.text(`Gesamtinvestition: €${totalInvested.toFixed(2)}`, 20, 64);
      doc.text(`Gewinn/Verlust: €${totalGain.toFixed(2)} (${gainPercent.toFixed(2)}%)`, 20, 70);
      doc.text(`Anzahl Positionen: ${portfolio.length}`, 20, 76);

      // Table
      doc.setFontSize(10);
      let y = 90;
      doc.text('Position', 20, y);
      doc.text('Kat.', 80, y);
      doc.text('Anzahl', 100, y);
      doc.text('Kurs', 120, y);
      doc.text('Wert (€)', 140, y);
      doc.text('Gewinn %', 170, y);

      y += 8;
      portfolio.forEach(p => {
        const pValue = p.quantity * p.current_value;
        const pGain = ((pValue - (p.quantity * p.purchase_price)) / (p.quantity * p.purchase_price)) * 100;
        
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        doc.text(p.name.substring(0, 20), 20, y);
        doc.text(p.asset_category.substring(0, 5), 80, y);
        doc.text(p.quantity.toFixed(2), 100, y);
        doc.text(p.current_value.toFixed(2), 120, y);
        doc.text(pValue.toFixed(2), 140, y);
        doc.text(pGain.toFixed(1) + '%', 170, y);
        y += 6;
      });

      const pdfBytes = doc.output('arraybuffer');
      return new Response(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=portfolio-report.pdf'
        }
      });
    }

    if (format === 'csv') {
      let csv = 'Name,Kategorie,Anzahl,Kaufpreis,Aktueller Kurs,Gesamtwert,Gewinn/Verlust,Gewinn %\n';
      
      portfolio.forEach(p => {
        const pValue = p.quantity * p.current_value;
        const pInvested = p.quantity * p.purchase_price;
        const pGain = pValue - pInvested;
        const pGainPercent = (pGain / pInvested) * 100;
        
        csv += `"${p.name}","${p.asset_category}",${p.quantity},${p.purchase_price},${p.current_value},${pValue},${pGain},${pGainPercent.toFixed(2)}\n`;
      });

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=portfolio.csv'
        }
      });
    }

    return Response.json({ error: 'Format nicht unterstützt' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});