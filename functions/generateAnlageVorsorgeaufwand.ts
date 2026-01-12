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

        // Hole alle Versicherungsverträge
        const insurances = await base44.asServiceRole.entities.InsuranceContract.list();

        // Initialisiere Beträge
        let krankenversicherungBasis = 0;
        let krankenversicherungZusatz = 0;
        let pflegeversicherung = 0;
        let arbeitslosenversicherung = 0;
        let rentenversicherungGesetzlich = 0;
        let ruerupRente = 0;
        let riesterRente = 0;
        let berufsunfaehigkeit = 0;
        let unfallversicherung = 0;
        let haftpflichtversicherung = 0;
        let lebensversicherung = 0;

        // Gruppiere nach insurance_type
        for (const insurance of insurances) {
            const amount = insurance.tax_deductible_amount || insurance.annual_premium;

            switch (insurance.insurance_type) {
                case 'krankenversicherung_gesetzlich':
                case 'krankenversicherung_privat':
                    if (insurance.is_basis_coverage) {
                        krankenversicherungBasis += amount;
                    } else {
                        krankenversicherungZusatz += amount;
                    }
                    break;
                case 'pflegeversicherung':
                    pflegeversicherung += amount;
                    break;
                case 'rentenversicherung_gesetzlich':
                    rentenversicherungGesetzlich += amount;
                    break;
                case 'ruerup_rente':
                    ruerupRente += amount;
                    break;
                case 'riester_rente':
                    riesterRente += amount;
                    break;
                case 'berufsunfaehigkeit':
                    berufsunfaehigkeit += amount;
                    break;
                case 'unfallversicherung':
                    unfallversicherung += amount;
                    break;
                case 'haftpflicht':
                    haftpflichtversicherung += amount;
                    break;
                case 'lebensversicherung':
                    lebensversicherung += amount;
                    break;
            }
        }

        const summeVorsorgeaufwendungen = krankenversicherungBasis + krankenversicherungZusatz + 
            pflegeversicherung + arbeitslosenversicherung + rentenversicherungGesetzlich + 
            ruerupRente + riesterRente + berufsunfaehigkeit + unfallversicherung + 
            haftpflichtversicherung + lebensversicherung;

        // Berechne abzugsfähigen Betrag (vereinfacht)
        // Höchstbetrag Altersvorsorge 2024: 26.528€
        // Höchstbetrag sonstige Vorsorge: 1.900€ (Arbeitnehmer)
        const maxAltersvorsorge = 26528;
        const maxSonstige = 1900;

        const altersvorsorge = Math.min(rentenversicherungGesetzlich + ruerupRente, maxAltersvorsorge);
        const sonstige = Math.min(krankenversicherungBasis + pflegeversicherung + berufsunfaehigkeit, maxSonstige);
        const abzugsfaehigerBetrag = altersvorsorge + sonstige;

        // Validierung
        const validationErrors = [];
        if (summeVorsorgeaufwendungen < 0) {
            validationErrors.push('Summe Vorsorgeaufwendungen darf nicht negativ sein');
        }

        // Erstelle oder aktualisiere AnlageVorsorgeaufwand
        const existing = await base44.asServiceRole.entities.AnlageVorsorgeaufwand.filter({
            tax_return_id,
            person
        });

        const anlageData = {
            tax_return_id,
            tax_year: taxReturn.tax_year,
            person,
            is_auto_generated: true,
            zeile_4_krankenversicherung_basis: krankenversicherungBasis,
            zeile_5_krankenversicherung_zusatz: krankenversicherungZusatz,
            zeile_6_pflegeversicherung: pflegeversicherung,
            zeile_7_arbeitslosenversicherung: arbeitslosenversicherung,
            zeile_8_rentenversicherung_gesetzlich: rentenversicherungGesetzlich,
            zeile_11_ruerup_rente: ruerupRente,
            zeile_12_riester_rente: riesterRente,
            zeile_17_berufsunfaehigkeit: berufsunfaehigkeit,
            zeile_18_unfallversicherung: unfallversicherung,
            zeile_19_haftpflichtversicherung: haftpflichtversicherung,
            zeile_21_lebensversicherung: lebensversicherung,
            summe_vorsorgeaufwendungen: summeVorsorgeaufwendungen,
            abzugsfaehiger_betrag: abzugsfaehigerBetrag,
            validation_errors: validationErrors,
            is_valid: validationErrors.length === 0
        };

        let anlage;
        if (existing.length > 0) {
            anlage = await base44.asServiceRole.entities.AnlageVorsorgeaufwand.update(existing[0].id, anlageData);
        } else {
            anlage = await base44.asServiceRole.entities.AnlageVorsorgeaufwand.create(anlageData);
        }

        return Response.json({ success: true, anlage_vorsorgeaufwand: anlage });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});