import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tax_return_id, person } = await req.json();

        // Hole TaxReturn
        const [taxReturn] = await base44.asServiceRole.entities.TaxReturn.filter({ id: tax_return_id });
        if (!taxReturn) {
            return Response.json({ error: 'Tax return not found' }, { status: 404 });
        }

        const taxYear = taxReturn.tax_year;

        // Hole alle Portfolios
        const portfolios = await base44.asServiceRole.entities.Portfolio.list();
        const portfolioIds = portfolios.map(p => p.id);

        // Hole alle TaxEvents für private Veräußerungsgeschäfte (Krypto, Edelmetalle)
        const allEvents = await base44.asServiceRole.entities.TaxEvent.list();
        const privateEvents = allEvents.filter(e => 
            e.tax_year === taxYear &&
            portfolioIds.some(pid => e.portfolio_id === pid) &&
            ['capital_gains_crypto', 'capital_gains_precious_metals'].includes(e.tax_category) &&
            e.is_tax_exempt === false
        );

        // Hole Assets und TaxLots
        const assets = await base44.asServiceRole.entities.Asset.list();
        const allTaxLots = await base44.asServiceRole.entities.TaxLot.list();

        const privateVeraeusserungen = [];
        let summeGewinne = 0;
        let summeVerluste = 0;

        for (const event of privateEvents) {
            const asset = assets.find(a => a.id === event.asset_id);
            
            // Finde zugehörigen TaxLot für Anschaffungsdatum
            const relatedLots = allTaxLots.filter(lot => 
                lot.asset_id === event.asset_id &&
                new Date(lot.purchase_date) <= new Date(event.event_date)
            ).sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));

            const firstLot = relatedLots[0];

            const veraeusserung = {
                art: asset?.asset_class === 'crypto' ? 'Kryptowährung' : 'Edelmetall',
                bezeichnung: asset?.name || 'Unbekannt',
                anschaffungsdatum: firstLot?.purchase_date || event.event_date,
                veraeusserungsdatum: event.event_date,
                veraeusserungspreis: event.gross_amount,
                anschaffungskosten: event.cost_basis || 0,
                werbungskosten: 0,
                gewinn_verlust: event.gain_loss
            };

            privateVeraeusserungen.push(veraeusserung);

            if (event.gain_loss > 0) {
                summeGewinne += event.gain_loss;
            } else {
                summeVerluste += event.gain_loss;
            }
        }

        // Prüfe Freigrenze § 23 Abs. 3 EStG (600€)
        const nettoGewinn = summeGewinne + summeVerluste;
        let freigrenze600Beachtet = true;
        let steuerpflichtigeEinkuenfte = nettoGewinn;

        if (nettoGewinn <= 600 && nettoGewinn > 0) {
            steuerpflichtigeEinkuenfte = 0;
            freigrenze600Beachtet = true;
        }

        // Validierung
        const validationErrors = [];
        if (privateVeraeusserungen.length > 0 && !privateVeraeusserungen[0].anschaffungsdatum) {
            validationErrors.push('Anschaffungsdatum fehlt für mindestens eine Veräußerung');
        }

        // Erstelle oder aktualisiere AnlageSO
        const existingSO = await base44.asServiceRole.entities.AnlageSO.filter({
            tax_return_id,
            person
        });

        const anlageSOData = {
            tax_return_id,
            tax_year: taxYear,
            person,
            is_auto_generated: true,
            last_generated: new Date().toISOString(),
            zeile_41_art_des_geschaefts: privateVeraeusserungen.length > 0 ? privateVeraeusserungen[0].art : null,
            zeile_42_anschaffungsdatum: privateVeraeusserungen.length > 0 ? privateVeraeusserungen[0].anschaffungsdatum : null,
            zeile_43_veraeusserungsdatum: privateVeraeusserungen.length > 0 ? privateVeraeusserungen[0].veraeusserungsdatum : null,
            zeile_44_veraeusserungspreis: privateVeraeusserungen.reduce((sum, v) => sum + v.veraeusserungspreis, 0),
            zeile_45_anschaffungskosten: privateVeraeusserungen.reduce((sum, v) => sum + v.anschaffungskosten, 0),
            zeile_46_werbungskosten: privateVeraeusserungen.reduce((sum, v) => sum + v.werbungskosten, 0),
            zeile_47_gewinn_verlust: nettoGewinn,
            private_veraeusserungen: privateVeraeusserungen,
            summe_gewinne: summeGewinne,
            summe_verluste: summeVerluste,
            freigrenze_600_beachtet: freigrenze600Beachtet,
            steuerpflichtige_einkuenfte: steuerpflichtigeEinkuenfte,
            validation_errors: validationErrors,
            is_valid: validationErrors.length === 0
        };

        let anlageSO;
        if (existingSO.length > 0) {
            anlageSO = await base44.asServiceRole.entities.AnlageSO.update(existingSO[0].id, anlageSOData);
        } else {
            anlageSO = await base44.asServiceRole.entities.AnlageSO.create(anlageSOData);
        }

        return Response.json({ success: true, anlage_so: anlageSO });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});