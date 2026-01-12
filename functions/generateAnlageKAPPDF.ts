import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { tax_year } = await req.json();
    
    console.log(`[Anlage KAP PDF] Generating for ${user.email}, year ${tax_year}`);
    
    // Daten abrufen
    const response = await base44.functions.invoke('generateAnlageKAP', { tax_year });
    const data = response.data;
    
    // PDF erstellen
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Anlage KAP', 20, 20);
    doc.setFontSize(12);
    doc.text(`Kapitalerträge ${tax_year}`, 20, 30);
    doc.text(`Erstellt für: ${user.full_name || user.email}`, 20, 37);
    doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, 44);
    
    let y = 60;
    
    // 1. Kapitalerträge
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('1. Kapitalerträge', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Dividenden und Zinsen:`, 30, y);
    doc.text(`${data.dividends.total.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 7;
    doc.text(`Realisierte Kursgewinne:`, 30, y);
    doc.text(`${data.capital_gains.total.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 7;
    doc.setFont(undefined, 'bold');
    doc.text(`Summe Einkünfte:`, 30, y);
    doc.text(`${data.summary.total_income.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 15;
    
    // 2. Freistellungsauftrag
    doc.setFontSize(14);
    doc.text('2. Freistellungsauftrag', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Gesamt verfügbar:`, 30, y);
    doc.text(`${data.freistellungsauftrag.total.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 7;
    doc.text(`Genutzt:`, 30, y);
    doc.text(`${data.freistellungsauftrag.used.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 7;
    doc.setFont(undefined, 'bold');
    doc.text(`Noch verfügbar:`, 30, y);
    doc.text(`${data.freistellungsauftrag.available.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 15;
    
    // 3. Verlustverrechnungstöpfe
    doc.setFontSize(14);
    doc.text('3. Verlustverrechnungstöpfe', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Aktien-Verlusttopf:`, 30, y);
    doc.text(`${data.loss_pots.stock.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 7;
    doc.text(`Sonstige-Verlusttopf:`, 30, y);
    doc.text(`${data.loss_pots.other.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 15;
    
    // 4. Steuerberechnung
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('4. Steuerberechnung', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Zu versteuernde Einkünfte:`, 30, y);
    doc.text(`${data.summary.taxable_income.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 10;
    doc.text(`Kapitalertragsteuer (25%):`, 30, y);
    doc.text(`${data.summary.kapitalertragsteuer.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 7;
    doc.text(`Solidaritätszuschlag (5,5%):`, 30, y);
    doc.text(`${data.summary.solidaritaetszuschlag.toFixed(2)} €`, 150, y, { align: 'right' });
    y += 10;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(`Gesamtsteuer:`, 30, y);
    doc.text(`${data.summary.total_tax.toFixed(2)} €`, 150, y, { align: 'right' });
    
    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Erstellt mit FinTuttoVermögen | Alle Angaben ohne Gewähr', 105, 280, { align: 'center' });
    
    const pdfBytes = doc.output('arraybuffer');
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Anlage_KAP_${tax_year}_${user.email}.pdf`
      }
    });
  } catch (error) {
    console.error('[Anlage KAP PDF] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});