import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tax_return_id } = await req.json();

        // Hole TaxReturn mit allen Anlagen
        const [taxReturn] = await base44.asServiceRole.entities.TaxReturn.filter({ id: tax_return_id });
        if (!taxReturn) {
            return Response.json({ error: 'Tax return not found' }, { status: 404 });
        }

        const [mantelbogen] = await base44.asServiceRole.entities.EstMantelbogen.filter({ tax_return_id });
        const anlageKAPs = await base44.asServiceRole.entities.AnlageKAP.filter({ tax_return_id });
        const anlageSOs = await base44.asServiceRole.entities.AnlageSO.filter({ tax_return_id });
        const anlageVs = await base44.asServiceRole.entities.AnlageVSubmission.filter({ tax_return_id });
        const anlageVorsorges = await base44.asServiceRole.entities.AnlageVorsorgeaufwand.filter({ tax_return_id });
        const anlageGs = await base44.asServiceRole.entities.AnlageG.filter({ tax_return_id });

        // Hole ELSTER Settings
        const settings = await base44.asServiceRole.entities.ElsterSettings.filter({ user_email: user.email });
        const ericServiceUrl = settings[0]?.eric_service_url || Deno.env.get('ERIC_SERVICE_URL');
        const ericApiKey = Deno.env.get('ERIC_SERVICE_API_KEY');
        const testMode = settings[0]?.test_mode !== false;

        if (!ericServiceUrl) {
            return Response.json({ error: 'ERiC service URL not configured' }, { status: 500 });
        }

        // Bereite Daten für ERiC-Microservice vor
        const payload = {
            tax_year: taxReturn.tax_year,
            submission_type: 'est',
            test_mode: testMode,
            mantelbogen: {
                steuernummer: mantelbogen?.zeile_1_steuernummer,
                finanzamt: mantelbogen?.zeile_2_finanzamt,
                name: mantelbogen?.zeile_7_name,
                vorname: mantelbogen?.zeile_8_vorname,
                geburtsdatum: mantelbogen?.zeile_9_geburtsdatum,
                strasse: mantelbogen?.zeile_10_strasse,
                plz_ort: mantelbogen?.zeile_11_plz_ort,
                steuerid: mantelbogen?.zeile_12_steuerid,
                religion: mantelbogen?.zeile_13_religion,
                familienstand: mantelbogen?.zeile_14_familienstand,
                iban: mantelbogen?.zeile_18_bankverbindung_iban,
                ehepartner_name: mantelbogen?.zeile_27_ehepartner_name,
                ehepartner_vorname: mantelbogen?.zeile_28_ehepartner_vorname,
                ehepartner_geburtsdatum: mantelbogen?.zeile_29_ehepartner_geburtsdatum,
                ehepartner_steuerid: mantelbogen?.zeile_30_ehepartner_steuerid
            },
            anlagen: {
                kap: anlageKAPs.map(kap => ({
                    person: kap.person,
                    zeile_7_kapitalertraege_inland: kap.zeile_7_kapitalertraege_inland,
                    zeile_8_kapitalertraege_ausland: kap.zeile_8_kapitalertraege_ausland,
                    zeile_14_dividenden: kap.zeile_14_dividenden,
                    zeile_15_zinsen: kap.zeile_15_zinsen,
                    zeile_16_investmentertraege: kap.zeile_16_investmentertraege,
                    zeile_17_teilfreistellung: kap.zeile_17_teilfreistellung,
                    zeile_18_gewinne_veraeusserung: kap.zeile_18_gewinne_veraeusserung,
                    zeile_19_verluste_veraeusserung: kap.zeile_19_verluste_veraeusserung,
                    zeile_20_verluste_aktien: kap.zeile_20_verluste_aktien,
                    zeile_37_anrechenbare_quellensteuer: kap.zeile_37_anrechenbare_quellensteuer,
                    zeile_48_kapest_einbehalten: kap.zeile_48_kapest_einbehalten,
                    zeile_49_soli_einbehalten: kap.zeile_49_soli_einbehalten
                })),
                so: anlageSOs.map(so => ({
                    person: so.person,
                    private_veraeusserungen: so.private_veraeusserungen,
                    summe_gewinne: so.summe_gewinne,
                    summe_verluste: so.summe_verluste,
                    steuerpflichtige_einkuenfte: so.steuerpflichtige_einkuenfte
                })),
                v: anlageVs.map(v => ({
                    // Daten aus bestehendem Anlage V Modul
                    einkuenfte: v.einkuenfte
                })),
                vorsorge: anlageVorsorges.map(v => ({
                    person: v.person,
                    zeile_4_krankenversicherung_basis: v.zeile_4_krankenversicherung_basis,
                    zeile_8_rentenversicherung_gesetzlich: v.zeile_8_rentenversicherung_gesetzlich,
                    zeile_11_ruerup_rente: v.zeile_11_ruerup_rente,
                    abzugsfaehiger_betrag: v.abzugsfaehiger_betrag
                }))
            }
        };

        // Rufe ERiC-Microservice auf
        const response = await fetch(`${ericServiceUrl}/xml/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ericApiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`ERiC service error: ${response.statusText}`);
        }

        const result = await response.json();

        // Speichere XML in privateStorage
        const xmlBlob = new Blob([result.xml_content], { type: 'application/xml' });
        const { data: uploadResult } = await base44.integrations.Core.UploadPrivateFile({ file: xmlBlob });

        // Erstelle oder aktualisiere ElsterSubmission
        const existingSubmissions = await base44.asServiceRole.entities.ElsterSubmission.filter({ tax_return_id });
        
        const submissionData = {
            tax_return_id,
            certificate_id: settings[0]?.default_certificate_id || '',
            submission_type: 'est',
            tax_year: taxReturn.tax_year,
            status: 'draft',
            xml_content: result.xml_content,
            xml_file_uri: uploadResult.file_uri,
            hints: result.validation_hints || [],
            retry_count: 0
        };

        let submission;
        if (existingSubmissions.length > 0) {
            submission = await base44.asServiceRole.entities.ElsterSubmission.update(existingSubmissions[0].id, submissionData);
        } else {
            submission = await base44.asServiceRole.entities.ElsterSubmission.create(submissionData);
        }

        // Log
        await base44.asServiceRole.entities.ElsterLog.create({
            submission_id: submission.id,
            action: 'validation_started',
            timestamp: new Date().toISOString(),
            success: true
        });

        return Response.json({ success: true, submission, xml_preview: result.xml_content.substring(0, 500) });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});