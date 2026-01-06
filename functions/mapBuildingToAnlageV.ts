import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Mapping Building-Daten zu Anlage V Formular
 * Sammelt automatisch alle relevanten Daten
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { building_id, tax_year } = await req.json();

        if (!building_id || !tax_year) {
            return Response.json({ error: 'building_id und tax_year erforderlich' }, { status: 400 });
        }

        // Gebäude laden
        const building = await base44.entities.Building.filter({ id: building_id });
        if (!building || building.length === 0) {
            return Response.json({ error: 'Gebäude nicht gefunden' }, { status: 404 });
        }
        const buildingData = building[0];

        // Mietverträge für das Jahr
        const contracts = await base44.entities.LeaseContract.filter({
            building_id: building_id
        });

        // Grundsteuer-Daten
        const propertyTax = await base44.entities.PropertyTax.filter({
            building_id: building_id
        });

        // Rechnungen/Ausgaben für das Jahr
        const invoices = await base44.entities.Invoice.filter({
            building_id: building_id
        });

        // Finanzierungen
        const financings = await base44.entities.Financing.filter({
            building_id: building_id
        });

        // Mapping der Daten
        const mappedData = {
            // Grundstücksdaten
            zeile_4: `${buildingData.address || ''} ${buildingData.house_number || ''}`.trim(),
            zeile_5: `${buildingData.postal_code || ''} ${buildingData.city || ''}`.trim(),
            zeile_6: propertyTax.length > 0 ? propertyTax[0].grundsteuermessbetrag_aktenzeichen : null,
            zeile_7: buildingData.purchase_date || buildingData.year_built,
            zeile_10: buildingData.total_sqm || 0,

            // Einnahmen - Soll-Mieten
            zeile_13: contracts.reduce((sum, c) => sum + ((c.rent_cold || 0) * 12), 0),

            // Werbungskosten - AfA
            zeile_33: this.calculateAfA(buildingData, tax_year),

            // Grundsteuer
            zeile_51: propertyTax.length > 0 ? (propertyTax[0].grundsteuer_jahresbetrag || 0) : 0,

            // Schuldzinsen
            zeile_39: financings.reduce((sum, f) => sum + (f.interest_rate || 0), 0),

            // Metadaten
            building_name: buildingData.name,
            building_id: building_id,
            tax_year: tax_year,
            mapped_at: new Date().toISOString(),
            data_complete: false
        };

        // Vollständigkeitsprüfung
        const missingFields = [];
        if (!mappedData.zeile_4) missingFields.push('Adresse');
        if (!mappedData.zeile_5) missingFields.push('PLZ/Ort');
        if (!mappedData.zeile_7) missingFields.push('Anschaffungsdatum');
        if (!mappedData.zeile_10 || mappedData.zeile_10 === 0) missingFields.push('Wohnfläche');

        return Response.json({
            success: true,
            mapped_data: mappedData,
            missing_fields: missingFields,
            data_complete: missingFields.length === 0,
            contracts_found: contracts.length,
            invoices_found: invoices.length,
            financings_found: financings.length
        });

    } catch (error) {
        console.error('Mapping error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateAfA(building, taxYear) {
    if (!building.purchase_price || !building.purchase_date) {
        return 0;
    }

    // AfA-Satz basierend auf Baujahr
    const buildYear = building.year_built || new Date(building.purchase_date).getFullYear();
    let afaRate = 2.0; // Standard

    if (buildYear < 1925) {
        afaRate = 2.5;
    } else if (buildYear >= 2023) {
        afaRate = 3.0; // Degressive AfA für Neubauten
    }

    // Nur Gebäudeanteil (80% als Standard wenn nicht explizit angegeben)
    const buildingValue = building.purchase_price * 0.8;
    
    return Math.round(buildingValue * (afaRate / 100));
}