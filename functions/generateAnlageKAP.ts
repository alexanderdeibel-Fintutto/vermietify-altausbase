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

        // Hole alle Portfolios des Users
        const portfolios = await base44.asServiceRole.entities.Portfolio.list();
        const portfolioIds = portfolios.map(p => p.id);

        // Hole alle TaxSummaries für das Jahr
        const taxSummaries = await base44.asServiceRole.entities.TaxSummary.filter({ tax_year: taxYear });
        const relevantSummaries = taxSummaries.filter(s => portfolioIds.includes(s.portfolio_id));

        // Hole alle TaxEvents für das Jahr
        const allEvents = await base44.asServiceRole.entities.TaxEvent.list();
        const taxEvents = allEvents.filter(e => e.tax_year === taxYear && portfolioIds.some(pid => e.portfolio_id === pid));

        // Hole Assets für Country-Check
        const assets = await base44.asServiceRole.entities.Asset.list();

        // Initialisiere Beträge
        let dividendenInland = 0;
        let dividendenAusland = 0;
        let zinsen = 0;
        let investmentertraege = 0;
        let teilfreistellung = 0;
        let gewinneVeraeusserung = 0;
        let verlusteVeraeusserung = 0;
        let verlusteAktien = 0;
        let anrechenbareQuellensteuer = 0;

        // Verarbeite Events
        for (const event of taxEvents) {
            const asset = assets.find(a => a.id === event.asset_id);

            // Dividenden
            if (event.event_type === 'dividend') {
                if (asset?.country === 'DE') {
                    dividendenInland += event.gross_amount;
                } else {
                    dividendenAusland += event.gross_amount;
                }
                if (event.withholding_tax_paid) {
                    anrechenbareQuellensteuer += event.withholding_tax_paid;
                }
            }

            // Zinsen
            if (event.event_type === 'interest') {
                zinsen += event.gross_amount;
            }

            // Investmenterträge (Fonds)
            if (event.tax_category === 'capital_gains_funds') {
                investmentertraege += event.gross_amount;
                if (event.partial_exemption_rate > 0) {
                    teilfreistellung += event.gain_loss * event.partial_exemption_rate;
                }
            }

            // Veräußerungsgewinne/-verluste (nur Aktien/Fonds, nicht Krypto/Edelmetalle)
            if (['capital_gains_stocks', 'capital_gains_funds'].includes(event.tax_category) && 
                ['sale'].includes(event.event_type)) {
                
                if (event.gain_loss > 0) {
                    gewinneVeraeusserung += event.gain_loss;
                } else if (event.tax_category === 'capital_gains_stocks') {
                    verlusteAktien += Math.abs(event.gain_loss);
                } else {
                    verlusteVeraeusserung += Math.abs(event.gain_loss);
                }
            }
        }

        // Hole Verlustvorträge
        const taxSettings = await base44.asServiceRole.entities.TaxSettings.filter({ user_email: user.email });
        const settings = taxSettings[0] || { loss_carryforward_stocks: 0, loss_carryforward_other: 0 };

        // Berechne einbehaltene Steuern (sollten aus Steuerbescheinigungen kommen)
        const kapitalertraege = dividendenInland + dividendenAusland + zinsen;
        const kapestEinbehalten = kapitalertraege * 0.25; // Schätzung
        const soliEinbehalten = kapestEinbehalten * 0.055; // Schätzung

        // Validierung
        const validationErrors = [];
        if (dividendenInland < 0) validationErrors.push('Inländische Dividenden dürfen nicht negativ sein');
        if (gewinneVeraeusserung < 0) validationErrors.push('Veräußerungsgewinne dürfen nicht negativ sein');

        // Erstelle oder aktualisiere AnlageKAP
        const existingKAP = await base44.asServiceRole.entities.AnlageKAP.filter({
            tax_return_id,
            person
        });

        const anlageKAPData = {
            tax_return_id,
            tax_year: taxYear,
            person,
            portfolio_ids: portfolioIds,
            is_auto_generated: true,
            last_generated: new Date().toISOString(),
            zeile_7_kapitalertraege_inland: dividendenInland + zinsen,
            zeile_8_kapitalertraege_ausland: dividendenAusland,
            zeile_14_dividenden: dividendenInland + dividendenAusland,
            zeile_15_zinsen: zinsen,
            zeile_16_investmentertraege: investmentertraege,
            zeile_17_teilfreistellung: teilfreistellung,
            zeile_18_gewinne_veraeusserung: gewinneVeraeusserung,
            zeile_19_verluste_veraeusserung: verlusteVeraeusserung,
            zeile_20_verluste_aktien: verlusteAktien,
            zeile_21_verlustvortrag_aktien: settings.loss_carryforward_stocks,
            zeile_22_verlustvortrag_sonstige: settings.loss_carryforward_other,
            zeile_37_anrechenbare_quellensteuer: anrechenbareQuellensteuer,
            zeile_38_angerechnete_quellensteuer: 0,
            zeile_48_kapest_einbehalten: kapestEinbehalten,
            zeile_49_soli_einbehalten: soliEinbehalten,
            zeile_50_kirchensteuer_einbehalten: 0,
            zeile_51_freistellungsauftrag_genutzt: 0,
            zeile_52_sparerpauschbetrag_beantragt: true,
            validation_errors: validationErrors,
            is_valid: validationErrors.length === 0
        };

        let anlageKAP;
        if (existingKAP.length > 0) {
            anlageKAP = await base44.asServiceRole.entities.AnlageKAP.update(existingKAP[0].id, anlageKAPData);
        } else {
            anlageKAP = await base44.asServiceRole.entities.AnlageKAP.create(anlageKAPData);
        }

        return Response.json({ success: true, anlage_kap: anlageKAP });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});