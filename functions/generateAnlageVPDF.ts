import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { anlageVId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // AnlageV laden
        const anlageV = await base44.entities.AnlageV.list();
        const data = anlageV.find(a => a.id === anlageVId);
        if (!data) {
            return new Response(JSON.stringify({ error: 'AnlageV not found' }), { status: 404 });
        }

        // Einnahmen & Kosten laden
        const [einnahmen, kosten] = await Promise.all([
            base44.entities.AnlageVEinnahmen.filter({ anlage_v_id: anlageVId }),
            base44.entities.AnlageVWerbungskosten.filter({ anlage_v_id: anlageVId })
        ]);

        // Building laden für Name
        const building = await base44.entities.Building.list();
        const buildingData = building.find(b => b.id === data.building_id);

        // PDF erstellen
        const doc = new jsPDF();
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;

        // Header
        doc.setFontSize(16);
        doc.text('Anlage V - Einnahmen und Werbungskosten aus Vermietung', margin, yPos);
        yPos += 12;

        // Info Box
        doc.setFontSize(10);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
        doc.text(`Gebäude: ${buildingData?.name || 'N/A'}`, margin + 3, yPos + 6);
        doc.text(`Steuerjahr: ${data.tax_year}`, margin + 3, yPos + 12);
        doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, margin + 3, yPos + 18);
        yPos += 25;

        // Einnahmen Sektion
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Zeile 1-8: Einkünfte aus Vermietung', margin, yPos);
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        einnahmen.forEach(e => {
            doc.text(`${e.description} (${e.category})`, margin + 5, yPos);
            doc.text(`€ ${e.amount.toFixed(2)}`, pageWidth - margin - 20, yPos, { align: 'right' });
            yPos += 5;
        });

        yPos += 2;
        doc.setFont(undefined, 'bold');
        doc.text('Summe Einnahmen:', margin + 5, yPos);
        doc.text(`€ ${data.total_rentals.toFixed(2)}`, pageWidth - margin - 20, yPos, { align: 'right' });
        yPos += 10;

        // Werbungskosten Sektion
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Zeile 9-27: Werbungskosten', margin, yPos);
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        kosten.forEach(k => {
            doc.text(`${k.description} (${k.category})`, margin + 5, yPos);
            doc.text(`€ ${k.amount.toFixed(2)}`, pageWidth - margin - 20, yPos, { align: 'right' });
            yPos += 5;
        });

        yPos += 2;
        doc.setFont(undefined, 'bold');
        doc.text('Summe Werbungskosten:', margin + 5, yPos);
        doc.text(`€ ${data.total_expenses.toFixed(2)}`, pageWidth - margin - 20, yPos, { align: 'right' });
        yPos += 10;

        // Ergebnis
        doc.setFillColor(data.net_income >= 0 ? 200, 255, 200 : 255, 200, 200);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('Gewinn/Verlust (Zeile 28):', margin + 3, yPos + 8);
        doc.text(`€ ${data.net_income.toFixed(2)}`, pageWidth - margin - 3, yPos + 8, { align: 'right' });

        // PDF Bytes
        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=AnlageV_${data.tax_year}.pdf`
            }
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});