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

        // PDF erstellen mit UTF-8 Support
        const doc = new jsPDF({
            compress: true,
            precision: 2
        });
        
        // Font für deutsche Umlaute setzen
        doc.setFont('helvetica');
        
        const pageWidth = doc.internal.pageSize.width;
        let y = 20;

        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`Anlage V ${submission.tax_year}`, 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Einkunfte aus Vermietung und Verpachtung', 20, y);
        y += 15;

        // Grundstuecksdaten
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Grundstuecksdaten', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const grundstuecksdaten = [
            ['Lfd. Nr.', submission.sequential_number || 1],
            ['Objekt', building?.name || ''],
            ['Adresse', formData.zeile_4 || ''],
            ['PLZ/Ort', formData.zeile_5 || ''],
            ['Anschaffung', formData.zeile_7 || ''],
            ['Wohnflaeche', `${formData.zeile_10 || 0} qm`]
        ];

        grundstuecksdaten.forEach(([label, value]) => {
            doc.text(`${label}:`, 20, y);
            doc.text(String(value), 80, y);
            y += 6;
        });

        y += 10;

        // Einnahmen
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Einnahmen', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const einnahmen = [
            ['Zeile 13', 'Soll-Miete', formData.zeile_13_soll_miete],
            ['Zeile 14', 'Ist-Miete', formData.zeile_14_ist_miete],
            ['Zeile 15', 'Vereinnahmt', formData.zeile_15_vereinnahmt],
            ['Zeile 20', 'Umlagen', formData.zeile_20_umlagen],
            ['Zeile 32', 'Summe Einnahmen', formData.zeile_32_summe]
        ];

        einnahmen.forEach(([zeile, label, value]) => {
            if (value !== undefined && value !== null) {
                doc.text(`${zeile}: ${label}`, 20, y);
                doc.text(`${Number(value).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR`, 140, y, { align: 'right' });
                y += 6;
            }
        });

        y += 10;

        // Werbungskosten
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Werbungskosten', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const werbungskosten = [
            ['Zeile 33', 'AfA', formData.zeile_33_afa],
            ['Zeile 39', 'Schuldzinsen', formData.zeile_39_schuldzinsen],
            ['Zeile 48', 'Erhaltungsaufwand', formData.zeile_48_erhaltung],
            ['Zeile 51', 'Grundsteuer', formData.zeile_51_grundsteuer],
            ['Zeile 53', 'Verwaltung', formData.zeile_53_verwaltung],
            ['Zeile 57', 'Versicherung', formData.zeile_57_versicherung],
            ['Zeile 82', 'Summe Werbungskosten', formData.zeile_82_summe]
        ];

        werbungskosten.forEach(([zeile, label, value]) => {
            if (value !== undefined && value !== null) {
                doc.text(`${zeile}: ${label}`, 20, y);
                doc.text(`${Number(value).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR`, 140, y, { align: 'right' });
                y += 6;
            }
        });

        y += 10;

        // Einkuenfte
        const einkuenfte = (formData.zeile_32_summe || 0) - (formData.zeile_82_summe || 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Zeile 84: Einkuenfte aus V+V', 20, y);
        doc.text(`${einkuenfte.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR`, 140, y, { align: 'right' });

        // Footer
        y = doc.internal.pageSize.height - 20;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, 20, y);

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Anlage_V_${submission.tax_year}_${building?.name || 'Objekt'}.pdf"`
            }
        });

    } catch (error) {
        console.error('Export PDF error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});