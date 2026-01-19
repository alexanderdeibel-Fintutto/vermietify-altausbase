import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { type, data, title } = await req.json();

        if (!type || !data) {
            return Response.json({ error: 'Type und Data sind erforderlich' }, { status: 400 });
        }

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(title || 'Vermitify Bericht', 20, 20);

        doc.setFontSize(10);
        doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);

        let y = 45;

        if (type === 'calculation') {
            // Calculation result PDF
            doc.setFontSize(14);
            doc.text('Berechnungsergebnis', 20, y);
            y += 10;

            doc.setFontSize(10);
            Object.entries(data).forEach(([key, value]) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const displayValue = typeof value === 'number' 
                    ? value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : value;
                
                doc.text(`${label}: ${displayValue}`, 20, y);
                y += 7;
            });
        } else if (type === 'quiz') {
            // Quiz result PDF
            doc.setFontSize(14);
            doc.text('Quiz-Ergebnis', 20, y);
            y += 10;

            doc.setFontSize(12);
            doc.text(`${data.result_title}`, 20, y);
            y += 10;

            doc.setFontSize(10);
            doc.text(`Score: ${data.score}/${data.max_score} (${data.percentage}%)`, 20, y);
            y += 10;

            doc.text(data.result_description || '', 20, y, { maxWidth: 170 });
            y += 20;

            if (data.recommendations && data.recommendations.length > 0) {
                doc.setFontSize(12);
                doc.text('Empfehlungen:', 20, y);
                y += 8;

                doc.setFontSize(10);
                data.recommendations.forEach(rec => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(`• ${rec}`, 25, y);
                    y += 7;
                });
            }
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Seite ${i} von ${pageCount}`, 190, 285, { align: 'right' });
            doc.text('Erstellt mit Vermitify', 20, 285);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${type}_${Date.now()}.pdf`
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});