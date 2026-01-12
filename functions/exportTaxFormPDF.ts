import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { form_type, form_id } = await req.json();

        const doc = new jsPDF();
        let formData = null;
        let title = '';

        if (form_type === 'anlage_kap') {
            const [form] = await base44.asServiceRole.entities.AnlageKAP.filter({ id: form_id });
            if (!form) {
                return Response.json({ error: 'Form not found' }, { status: 404 });
            }
            formData = form;
            title = `Anlage KAP ${form.tax_year}`;

            // PDF-Generierung
            doc.setFontSize(20);
            doc.text(title, 20, 20);
            
            doc.setFontSize(12);
            let y = 40;
            
            doc.text('Kapitalerträge', 20, y);
            y += 10;
            doc.setFontSize(10);
            doc.text(`Zeile 7: Kapitalerträge (inländisch): ${formatCurrency(form.zeile_7_kapitalertraege_inland)}`, 25, y);
            y += 7;
            doc.text(`Zeile 8: Kapitalerträge (ausländisch): ${formatCurrency(form.zeile_8_kapitalertraege_ausland)}`, 25, y);
            y += 10;

            doc.setFontSize(12);
            doc.text('Erträge im Einzelnen', 20, y);
            y += 10;
            doc.setFontSize(10);
            doc.text(`Zeile 14: Dividenden: ${formatCurrency(form.zeile_14_dividenden)}`, 25, y);
            y += 7;
            doc.text(`Zeile 15: Zinsen: ${formatCurrency(form.zeile_15_zinsen)}`, 25, y);
            y += 7;
            doc.text(`Zeile 16: Investmenterträge: ${formatCurrency(form.zeile_16_investmentertraege)}`, 25, y);
            y += 7;
            doc.text(`Zeile 17: Teilfreistellung: ${formatCurrency(form.zeile_17_teilfreistellung)}`, 25, y);
            y += 10;

            doc.setFontSize(12);
            doc.text('Veräußerungen', 20, y);
            y += 10;
            doc.setFontSize(10);
            doc.text(`Zeile 18: Gewinne: ${formatCurrency(form.zeile_18_gewinne_veraeusserung)}`, 25, y);
            y += 7;
            doc.text(`Zeile 19: Verluste (ohne Aktien): ${formatCurrency(form.zeile_19_verluste_veraeusserung)}`, 25, y);
            y += 7;
            doc.text(`Zeile 20: Verluste Aktien: ${formatCurrency(form.zeile_20_verluste_aktien)}`, 25, y);
            y += 10;

            doc.setFontSize(12);
            doc.text('Steuern', 20, y);
            y += 10;
            doc.setFontSize(10);
            doc.text(`Zeile 37: Anrechenbare Quellensteuer: ${formatCurrency(form.zeile_37_anrechenbare_quellensteuer)}`, 25, y);
            y += 7;
            doc.text(`Zeile 48: Kapitalertragsteuer: ${formatCurrency(form.zeile_48_kapest_einbehalten)}`, 25, y);
            y += 7;
            doc.text(`Zeile 49: Solidaritätszuschlag: ${formatCurrency(form.zeile_49_soli_einbehalten)}`, 25, y);
        }

        if (form_type === 'anlage_so') {
            const [form] = await base44.asServiceRole.entities.AnlageSO.filter({ id: form_id });
            if (!form) {
                return Response.json({ error: 'Form not found' }, { status: 404 });
            }
            formData = form;
            title = `Anlage SO ${form.tax_year}`;

            doc.setFontSize(20);
            doc.text(title, 20, 20);
            
            doc.setFontSize(12);
            let y = 40;
            
            doc.text('Private Veräußerungsgeschäfte', 20, y);
            y += 15;

            if (form.private_veraeusserungen && form.private_veraeusserungen.length > 0) {
                doc.setFontSize(10);
                form.private_veraeusserungen.forEach((v, idx) => {
                    doc.text(`${idx + 1}. ${v.bezeichnung} (${v.art})`, 25, y);
                    y += 7;
                    doc.text(`   Anschaffung: ${new Date(v.anschaffungsdatum).toLocaleDateString('de-DE')} - Veräußerung: ${new Date(v.veraeusserungsdatum).toLocaleDateString('de-DE')}`, 25, y);
                    y += 7;
                    doc.text(`   Gewinn/Verlust: ${formatCurrency(v.gewinn_verlust)}`, 25, y);
                    y += 10;
                });
            }

            y += 5;
            doc.setFontSize(12);
            doc.text('Zusammenfassung', 20, y);
            y += 10;
            doc.setFontSize(10);
            doc.text(`Summe Gewinne: ${formatCurrency(form.summe_gewinne)}`, 25, y);
            y += 7;
            doc.text(`Summe Verluste: ${formatCurrency(form.summe_verluste)}`, 25, y);
            y += 7;
            doc.text(`Steuerpflichtige Einkünfte: ${formatCurrency(form.steuerpflichtige_einkuenfte)}`, 25, y);
            y += 10;

            if (form.freigrenze_600_beachtet && form.summe_gewinne <= 600) {
                doc.text('Hinweis: Freigrenze von 600€ nicht überschritten - steuerfrei', 25, y);
            }
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${title}.pdf"`
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}