import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { form_type, form_id } = await req.json();

        const errors = [];
        const warnings = [];

        if (form_type === 'anlage_kap') {
            const [form] = await base44.asServiceRole.entities.AnlageKAP.filter({ id: form_id });
            if (!form) {
                return Response.json({ error: 'Form not found' }, { status: 404 });
            }

            // Validierungen
            if (form.zeile_14_dividenden < 0) {
                errors.push({ field: 'zeile_14_dividenden', message: 'Dividenden dürfen nicht negativ sein', severity: 'error' });
            }

            if (form.zeile_37_anrechenbare_quellensteuer > form.zeile_14_dividenden * 0.15) {
                warnings.push({ field: 'zeile_37_anrechenbare_quellensteuer', message: 'Quellensteuer > 15% - Rückforderung im Ausland prüfen', severity: 'warning' });
            }

            if (form.zeile_48_kapest_einbehalten === 0 && form.zeile_14_dividenden > 0) {
                warnings.push({ field: 'zeile_48_kapest_einbehalten', message: 'Keine Kapitalertragsteuer einbehalten? Prüfen Sie Ihre Steuerbescheinigungen', severity: 'warning' });
            }

            // Prüfe ob Summen plausibel sind
            const gesamtErtraege = form.zeile_7_kapitalertraege_inland + form.zeile_8_kapitalertraege_ausland;
            const detailSumme = form.zeile_14_dividenden + form.zeile_15_zinsen + form.zeile_16_investmentertraege;
            
            if (Math.abs(gesamtErtraege - detailSumme) > 1) {
                warnings.push({ field: 'zeile_7_kapitalertraege_inland', message: 'Summe Kapitalerträge stimmt nicht mit Detailangaben überein', severity: 'warning' });
            }
        }

        if (form_type === 'anlage_so') {
            const [form] = await base44.asServiceRole.entities.AnlageSO.filter({ id: form_id });
            if (!form) {
                return Response.json({ error: 'Form not found' }, { status: 404 });
            }

            // Validierung Freigrenze
            if (form.summe_gewinne > 600 && form.steuerpflichtige_einkuenfte === 0) {
                errors.push({ field: 'steuerpflichtige_einkuenfte', message: 'Freigrenze überschritten - alle Gewinne sind steuerpflichtig', severity: 'error' });
            }

            if (form.summe_gewinne <= 600 && form.summe_gewinne > 0 && form.steuerpflichtige_einkuenfte > 0) {
                warnings.push({ field: 'steuerpflichtige_einkuenfte', message: 'Freigrenze nicht überschritten - keine Steuerpflicht', severity: 'warning' });
            }

            // Prüfe Haltedauer
            if (form.private_veraeusserungen) {
                for (const v of form.private_veraeusserungen) {
                    const anschaffung = new Date(v.anschaffungsdatum);
                    const veraeusserung = new Date(v.veraeusserungsdatum);
                    const days = Math.floor((veraeusserung - anschaffung) / (1000 * 60 * 60 * 24));
                    
                    if (days <= 365) {
                        // OK - Innerhalb Spekulationsfrist
                    } else {
                        warnings.push({ field: 'private_veraeusserungen', message: `${v.bezeichnung}: Haltedauer > 1 Jahr - sollte steuerfrei sein`, severity: 'warning' });
                    }
                }
            }
        }

        const isValid = errors.length === 0;

        return Response.json({ 
            is_valid: isValid, 
            errors, 
            warnings 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});