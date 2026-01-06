import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Seed der Anlage V 2024 Formularstruktur
 * Lädt die komplette Felddefinition der Anlage V 2024
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Prüfen ob bereits vorhanden
        const existing = await base44.asServiceRole.entities.TaxForm.filter({
            tax_year: 2024,
            form_type: 'AnlageV'
        });

        if (existing.length > 0) {
            return Response.json({
                success: false,
                message: 'Anlage V 2024 bereits vorhanden',
                form_id: existing[0].id
            });
        }

        // Anlage V 2024 Struktur
        const anlageV2024 = {
            tax_year: 2024,
            form_type: 'AnlageV',
            version: '2024.1',
            status: 'aktiv',
            field_definitions: {
                sections: {
                    grundstuecksdaten: {
                        title: 'Grundstücksdaten',
                        lines: '1-8'
                    },
                    flaechenangaben: {
                        title: 'Flächenangaben',
                        lines: '9-12'
                    },
                    einnahmen: {
                        title: 'Einnahmen',
                        lines: '13-32'
                    },
                    werbungskosten: {
                        title: 'Werbungskosten',
                        lines: '33-83'
                    },
                    sonderregelungen: {
                        title: 'Sonderregelungen',
                        lines: '84-88'
                    }
                }
            },
            calculation_logic: {
                zeile_15: 'MIN(zeile_13, zeile_14)',
                zeile_32: 'SUM(zeile_15:zeile_31)',
                zeile_34: 'zeile_33 * (vermietet_anteil / 100)',
                zeile_79: 'SUM(zeile_33:zeile_78)',
                zeile_82: 'zeile_79 + zeile_80 + zeile_81',
                zeile_84: 'zeile_32 - zeile_82'
            }
        };

        const form = await base44.asServiceRole.entities.TaxForm.create(anlageV2024);

        // Felder anlegen - Grundstücksdaten
        const fields = [
            {
                form_id: form.id,
                line_number: 1,
                field_name: 'lfd_nummer_anlage',
                label: 'Laufende Nummer der Anlage',
                field_type: 'anzahl',
                required: true,
                help_text: 'Fortlaufende Nummerierung bei mehreren Objekten'
            },
            {
                form_id: form.id,
                line_number: 2,
                field_name: 'art_des_objekts',
                label: 'Art des Objekts',
                field_type: 'checkbox',
                data_source: 'building.usage_type',
                help_text: 'Wohnung, Ein-/Zweifamilienhaus, Mehrfamilienhaus, Gewerbe'
            },
            {
                form_id: form.id,
                line_number: 4,
                field_name: 'lage_strasse_hausnummer',
                label: 'Lage (Straße, Hausnummer)',
                field_type: 'text',
                required: true,
                data_source: 'building.address + building.house_number'
            },
            {
                form_id: form.id,
                line_number: 5,
                field_name: 'postleitzahl_ort',
                label: 'Postleitzahl, Ort',
                field_type: 'text',
                required: true,
                data_source: 'building.postal_code + building.city'
            },
            {
                form_id: form.id,
                line_number: 6,
                field_name: 'aktenzeichen_grundsteuermessbescheid',
                label: 'Aktenzeichen Grundsteuermessbescheid',
                field_type: 'text',
                data_source: 'property_tax.grundsteuermessbetrag_aktenzeichen',
                help_text: 'Neu ab 2024 - ersetzt Einheitswert-Aktenzeichen'
            },
            {
                form_id: form.id,
                line_number: 7,
                field_name: 'anschaffung_fertigstellung',
                label: 'Anschaffung/Fertigstellung',
                field_type: 'datum',
                required: true,
                data_source: 'building.purchase_date',
                help_text: 'Relevant für AfA-Berechnung'
            },
            {
                form_id: form.id,
                line_number: 10,
                field_name: 'gesamtwohnflaeche',
                label: 'Gesamtwohnfläche',
                field_type: 'betrag',
                required: true,
                data_source: 'building.total_sqm',
                help_text: 'Wohnfläche in Quadratmetern'
            },
            {
                form_id: form.id,
                line_number: 13,
                field_name: 'mieteinnahmen_kalt_soll',
                label: 'Mieteinnahmen (Kaltmiete Soll)',
                field_type: 'betrag',
                data_source: 'SUM(lease_contract.rent_cold * 12)',
                help_text: 'Soll-Miete aus Mietverträgen'
            },
            {
                form_id: form.id,
                line_number: 14,
                field_name: 'mieteinnahmen_kalt_ist',
                label: 'Mieteinnahmen (Kaltmiete Ist)',
                field_type: 'betrag',
                data_source: 'SUM(payment.amount WHERE category=rent)',
                help_text: 'Tatsächlich vereinnahmte Miete'
            },
            {
                form_id: form.id,
                line_number: 15,
                field_name: 'mieteinnahmen_vereinnahmt',
                label: 'Mieteinnahmen vereinnahmt',
                field_type: 'betrag',
                calculation_formula: 'MIN(zeile_13, zeile_14)',
                help_text: 'Niedrigerer Wert aus Soll und Ist'
            },
            {
                form_id: form.id,
                line_number: 20,
                field_name: 'umlagen_vereinnahmt',
                label: 'Umlagen vereinnahmt',
                field_type: 'betrag',
                data_source: 'SUM(payment.amount WHERE category=utilities)',
                help_text: 'Nebenkosten-Vorauszahlungen'
            },
            {
                form_id: form.id,
                line_number: 32,
                field_name: 'summe_einnahmen',
                label: 'Summe der Einnahmen',
                field_type: 'betrag',
                calculation_formula: 'SUM(zeile_15:zeile_31)',
                help_text: 'Automatisch berechnet'
            },
            {
                form_id: form.id,
                line_number: 33,
                field_name: 'afa_gebaeude_gesamt',
                label: 'AfA Gebäude gesamt',
                field_type: 'betrag',
                data_source: 'building.purchase_price * afa_rate',
                help_text: 'Abschreibung - Satz abhängig von Baujahr'
            },
            {
                form_id: form.id,
                line_number: 39,
                field_name: 'schuldzinsen_gesamt',
                label: 'Schuldzinsen gesamt',
                field_type: 'betrag',
                data_source: 'SUM(financing.interest_paid)',
                help_text: 'Gezahlte Darlehenszinsen'
            },
            {
                form_id: form.id,
                line_number: 51,
                field_name: 'grundsteuer_gesamt',
                label: 'Grundsteuer gesamt',
                field_type: 'betrag',
                data_source: 'property_tax.grundsteuer_jahresbetrag',
                help_text: 'Jahresbetrag Grundsteuer'
            },
            {
                form_id: form.id,
                line_number: 82,
                field_name: 'summe_werbungskosten',
                label: 'Summe der Werbungskosten',
                field_type: 'betrag',
                calculation_formula: 'SUM(zeile_33:zeile_81)',
                help_text: 'Automatisch berechnet'
            },
            {
                form_id: form.id,
                line_number: 84,
                field_name: 'einkuenfte',
                label: 'Einkünfte aus V+V',
                field_type: 'betrag',
                calculation_formula: 'zeile_32 - zeile_82',
                help_text: 'Einnahmen minus Werbungskosten'
            }
        ];

        for (const field of fields) {
            await base44.asServiceRole.entities.TaxFormField.create(field);
        }

        return Response.json({
            success: true,
            message: 'Anlage V 2024 erfolgreich initialisiert',
            form_id: form.id,
            fields_created: fields.length
        });

    } catch (error) {
        console.error('Seed Anlage V error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});