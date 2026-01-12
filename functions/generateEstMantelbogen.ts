import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tax_return_id } = await req.json();

        // Hole TaxReturn
        const [taxReturn] = await base44.asServiceRole.entities.TaxReturn.filter({ id: tax_return_id });
        if (!taxReturn) {
            return Response.json({ error: 'Tax return not found' }, { status: 404 });
        }

        // Hole alle Anlagen
        const anlageKAPs = await base44.asServiceRole.entities.AnlageKAP.filter({ tax_return_id });
        const anlageSOs = await base44.asServiceRole.entities.AnlageSO.filter({ tax_return_id });
        const anlageGs = await base44.asServiceRole.entities.AnlageG.filter({ tax_return_id });
        const anlageVs = await base44.asServiceRole.entities.AnlageVSubmission.filter({ tax_return_id });
        const anlageVorsorges = await base44.asServiceRole.entities.AnlageVorsorgeaufwand.filter({ tax_return_id });

        // Berechne Summe der Einkünfte
        const einkuenfteKapitalvermoegen = anlageKAPs.reduce((sum, k) => {
            const gewinne = k.zeile_18_gewinne_veraeusserung || 0;
            const verluste = (k.zeile_19_verluste_veraeusserung || 0) + (k.zeile_20_verluste_aktien || 0);
            return sum + k.zeile_14_dividenden + k.zeile_15_zinsen + gewinne - verluste;
        }, 0);

        const einkuenfteVermietung = anlageVs.reduce((sum, v) => sum + (v.einkuenfte || 0), 0);
        const sonstigeEinkuenfte = anlageSOs.reduce((sum, s) => sum + (s.steuerpflichtige_einkuenfte || 0), 0);
        const gewerblicheEinkuenfte = anlageGs.reduce((sum, g) => sum + (g.zeile_23_gewinn_verlust || 0), 0);
        const sonderausgaben = anlageVorsorges.reduce((sum, v) => sum + (v.abzugsfaehiger_betrag || 0), 0);

        const summeEinkuenfte = {
            einkuenfte_kapitalvermoegen: einkuenfteKapitalvermoegen,
            einkuenfte_vermietung: einkuenfteVermietung,
            sonstige_einkuenfte: sonstigeEinkuenfte,
            gewerbliche_einkuenfte: gewerblicheEinkuenfte,
            sonderausgaben: sonderausgaben,
            gesamtbetrag_einkuenfte: einkuenfteKapitalvermoegen + einkuenfteVermietung + sonstigeEinkuenfte + gewerblicheEinkuenfte - sonderausgaben
        };

        // Liste beigefügte Anlagen
        const beigefuegteAnlagen = [];
        if (anlageKAPs.length > 0) beigefuegteAnlagen.push('Anlage KAP');
        if (anlageSOs.length > 0) beigefuegteAnlagen.push('Anlage SO');
        if (anlageGs.length > 0) beigefuegteAnlagen.push('Anlage G');
        if (anlageVs.length > 0) beigefuegteAnlagen.push('Anlage V');
        if (anlageVorsorges.length > 0) beigefuegteAnlagen.push('Anlage Vorsorgeaufwand');

        // Validierung
        const validationErrors = [];
        if (!taxReturn.taxpayer_name) validationErrors.push('Name fehlt');
        if (!taxReturn.taxpayer_id) validationErrors.push('Steuer-ID fehlt');

        // Erstelle oder aktualisiere EstMantelbogen
        const existing = await base44.asServiceRole.entities.EstMantelbogen.filter({ tax_return_id });

        const mantelbogenData = {
            tax_return_id,
            tax_year: taxReturn.tax_year,
            is_auto_generated: true,
            zeile_1_steuernummer: taxReturn.tax_number,
            zeile_2_finanzamt: taxReturn.tax_office_number,
            zeile_7_name: taxReturn.taxpayer_name,
            zeile_8_vorname: taxReturn.taxpayer_name?.split(' ')[0],
            zeile_9_geburtsdatum: taxReturn.taxpayer_birthdate,
            zeile_10_strasse: taxReturn.taxpayer_address?.street,
            zeile_11_plz_ort: `${taxReturn.taxpayer_address?.postal_code || ''} ${taxReturn.taxpayer_address?.city || ''}`,
            zeile_12_steuerid: taxReturn.taxpayer_id,
            zeile_27_ehepartner_name: taxReturn.spouse_name,
            zeile_28_ehepartner_vorname: taxReturn.spouse_name?.split(' ')[0],
            zeile_29_ehepartner_geburtsdatum: taxReturn.spouse_birthdate,
            zeile_30_ehepartner_steuerid: taxReturn.spouse_id,
            beigefuegte_anlagen: beigefuegteAnlagen,
            summe_einkuenfte: summeEinkuenfte,
            validation_errors: validationErrors,
            is_valid: validationErrors.length === 0
        };

        let mantelbogen;
        if (existing.length > 0) {
            mantelbogen = await base44.asServiceRole.entities.EstMantelbogen.update(existing[0].id, mantelbogenData);
        } else {
            mantelbogen = await base44.asServiceRole.entities.EstMantelbogen.create(mantelbogenData);
        }

        return Response.json({ success: true, mantelbogen });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});