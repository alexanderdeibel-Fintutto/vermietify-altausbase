import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

/**
 * Export Anlage V als PDF
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { submission_id } = await req.json();

        // Submission laden
        const submissions = await base44.entities.AnlageVSubmission.filter({ id: submission_id });
        if (!submissions || submissions.length === 0) {
            return Response.json({ error: 'Submission nicht gefunden' }, { status: 404 });
        }
        const submission = submissions[0];

        // Gebäude laden
        const buildings = await base44.entities.Building.filter({ id: submission.building_id });
        const building = buildings.length > 0 ? buildings[0] : null;

        const formData = submission.form_data;

        // Helper für Betragsformatierung
        const formatAmount = (value) => {
            const num = Number(value || 0);
            return num.toFixed(2).replace('.', ',') + ' EUR';
        };

        // PDF erstellen
        const doc = new jsPDF();
        let y = 20;

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Anlage V ' + submission.tax_year, 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Einkuenfte aus Vermietung und Verpachtung', 20, y);
        y += 15;

        // Grundstuecksdaten
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Grundstuecksdaten', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.text('Lfd. Nr.:', 20, y);
        doc.text(String(submission.sequential_number || 1), 80, y);
        y += 6;
        
        if (building?.name) {
            doc.text('Objekt:', 20, y);
            doc.text(building.name, 80, y);
            y += 6;
        }
        
        if (formData.zeile_4) {
            doc.text('Adresse:', 20, y);
            doc.text(formData.zeile_4, 80, y);
            y += 6;
        }
        
        if (formData.zeile_5) {
            doc.text('PLZ/Ort:', 20, y);
            doc.text(formData.zeile_5, 80, y);
            y += 6;
        }
        
        if (formData.zeile_7) {
            doc.text('Anschaffung:', 20, y);
            doc.text(String(formData.zeile_7), 80, y);
            y += 6;
        }
        
        if (formData.zeile_10) {
            doc.text('Wohnflaeche:', 20, y);
            doc.text(formData.zeile_10 + ' qm', 80, y);
            y += 6;
        }
        
        y += 10;

        // Einnahmen
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Einnahmen', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.text('Zeile 13: Soll-Miete', 20, y);
        doc.text(formatAmount(formData.zeile_13_soll_miete), 150, y);
        y += 6;
        
        doc.text('Zeile 14: Ist-Miete', 20, y);
        doc.text(formatAmount(formData.zeile_14_ist_miete), 150, y);
        y += 6;
        
        doc.text('Zeile 15: Vereinnahmt', 20, y);
        doc.text(formatAmount(formData.zeile_15_vereinnahmt), 150, y);
        y += 6;
        
        doc.text('Zeile 20: Umlagen', 20, y);
        doc.text(formatAmount(formData.zeile_20_umlagen), 150, y);
        y += 6;
        
        doc.text('Zeile 32: Summe Einnahmen', 20, y);
        doc.text(formatAmount(formData.zeile_32_summe), 150, y);
        y += 10;

        // Werbungskosten
        if (y > 220) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Werbungskosten', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.text('Zeile 33: AfA', 20, y);
        doc.text(formatAmount(formData.zeile_33_afa), 150, y);
        y += 6;
        
        doc.text('Zeile 39: Schuldzinsen', 20, y);
        doc.text(formatAmount(formData.zeile_39_schuldzinsen), 150, y);
        y += 6;
        
        doc.text('Zeile 48: Erhaltungsaufwand', 20, y);
        doc.text(formatAmount(formData.zeile_48_erhaltung), 150, y);
        y += 6;
        
        doc.text('Zeile 51: Grundsteuer', 20, y);
        doc.text(formatAmount(formData.zeile_51_grundsteuer), 150, y);
        y += 6;
        
        doc.text('Zeile 53: Verwaltung', 20, y);
        doc.text(formatAmount(formData.zeile_53_verwaltung), 150, y);
        y += 6;
        
        doc.text('Zeile 57: Versicherung', 20, y);
        doc.text(formatAmount(formData.zeile_57_versicherung), 150, y);
        y += 6;
        
        doc.text('Zeile 82: Summe Werbungskosten', 20, y);
        doc.text(formatAmount(formData.zeile_82_summe), 150, y);
        y += 10;

        // Einkuenfte
        const einkuenfte = (formData.zeile_32_summe || 0) - (formData.zeile_82_summe || 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Zeile 84: Einkuenfte aus V+V', 20, y);
        doc.text(formatAmount(einkuenfte), 150, y);

        // Footer
        y = doc.internal.pageSize.height - 20;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const dateStr = new Date().toLocaleDateString('de-DE');
        doc.text('Erstellt am ' + dateStr, 20, y);

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Anlage_V_${submission.tax_year}.pdf"`
            }
        });

    } catch (error) {
        console.error('Export PDF error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});