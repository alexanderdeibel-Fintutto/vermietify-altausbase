import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Detaillierte Werbungskostenberechnung für Anlage V
 * Ermittelt alle absetzbaren Ausgaben
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { building_id, tax_year } = await req.json();

        // Gebäude laden für AfA
        const buildings = await base44.entities.Building.filter({ id: building_id });
        if (!buildings || buildings.length === 0) {
            return Response.json({ error: 'Gebäude nicht gefunden' }, { status: 404 });
        }
        const building = buildings[0];

        // Zeitraum
        const yearStart = `${tax_year}-01-01`;
        const yearEnd = `${tax_year}-12-31`;

        // Rechnungen/Ausgaben
        const invoices = await base44.entities.Invoice.filter({
            building_id: building_id,
            invoice_date: { $gte: yearStart, $lte: yearEnd }
        });

        // Grundsteuer
        const propertyTax = await base44.entities.PropertyTax.filter({
            building_id: building_id,
            grundsteuerbescheid_jahr: tax_year
        });

        // Finanzierungen
        const financings = await base44.entities.Financing.filter({
            building_id: building_id
        });

        // AfA berechnen (Zeile 33-35)
        const afa = calculateAfA(building, tax_year);

        // Schuldzinsen (Zeile 39-41)
        let schuldzinsen = 0;
        for (const financing of financings) {
            // Zinsen für das Jahr berechnen
            const rate = financing.interest_rate || 0;
            const amount = financing.loan_amount || 0;
            schuldzinsen += (amount * rate / 100);
        }

        // Erhaltungsaufwendungen (Zeile 48-50)
        const erhaltung = invoices
            .filter(i => i.cost_category_id && 
                   ['maintenance', 'repair', 'renovation'].includes(i.cost_category_id))
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        // Grundsteuer (Zeile 51-52)
        const grundsteuer = propertyTax.length > 0 
            ? (propertyTax[0].grundsteuer_jahresbetrag || 0) 
            : 0;

        // Verwaltung (Zeile 53-54)
        const verwaltung = invoices
            .filter(i => ['management', 'administration'].includes(i.cost_category_id))
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        // Versicherungen (Zeile 57-58)
        const versicherung = invoices
            .filter(i => i.cost_category_id === 'insurance')
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        // Nebenkosten nicht umgelegt (Zeile 61-62)
        const nebenkostenNichtUmgelegt = invoices
            .filter(i => ['utilities', 'heating', 'water'].includes(i.cost_category_id) &&
                   !i.operating_cost_relevant)
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        // Hausmeister/Reinigung (Zeile 63-64)
        const hausmeister = invoices
            .filter(i => ['caretaker', 'cleaning'].includes(i.cost_category_id))
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        // Rechts-/Steuerberatung (Zeile 75)
        const beratung = invoices
            .filter(i => ['legal', 'tax_consulting'].includes(i.cost_category_id))
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        // Sonstige Werbungskosten (Zeile 76)
        const sonstige = invoices
            .filter(i => ['other_costs', 'miscellaneous'].includes(i.cost_category_id))
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        // Summe Werbungskosten (Zeile 82)
        const summeWerbungskosten = afa + schuldzinsen + erhaltung + grundsteuer + 
            verwaltung + versicherung + nebenkostenNichtUmgelegt + hausmeister + 
            beratung + sonstige;

        return Response.json({
            success: true,
            werbungskosten: {
                zeile_33_afa: Math.round(afa * 100) / 100,
                zeile_39_schuldzinsen: Math.round(schuldzinsen * 100) / 100,
                zeile_48_erhaltung: Math.round(erhaltung * 100) / 100,
                zeile_51_grundsteuer: Math.round(grundsteuer * 100) / 100,
                zeile_53_verwaltung: Math.round(verwaltung * 100) / 100,
                zeile_57_versicherung: Math.round(versicherung * 100) / 100,
                zeile_61_nebenkosten: Math.round(nebenkostenNichtUmgelegt * 100) / 100,
                zeile_63_hausmeister: Math.round(hausmeister * 100) / 100,
                zeile_75_beratung: Math.round(beratung * 100) / 100,
                zeile_76_sonstige: Math.round(sonstige * 100) / 100,
                zeile_82_summe: Math.round(summeWerbungskosten * 100) / 100
            },
            details: {
                invoices_count: invoices.length,
                financings_count: financings.length,
                afa_details: {
                    purchase_price: building.purchase_price,
                    year_built: building.year_built,
                    afa_rate: getAfARate(building)
                }
            }
        });

    } catch (error) {
        console.error('Calculate Werbungskosten error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateAfA(building, taxYear) {
    if (!building.purchase_price || !building.purchase_date) {
        return 0;
    }

    const buildYear = building.year_built || new Date(building.purchase_date).getFullYear();
    const afaRate = getAfARate(building);

    // Nur Gebäudeanteil (80% Standard wenn nicht explizit)
    const buildingValue = building.purchase_price * 0.8;
    
    // Prüfen ob AfA-Zeitraum noch läuft
    const purchaseYear = new Date(building.purchase_date).getFullYear();
    const afaDuration = buildYear < 1925 ? 40 : 50; // 2.5% = 40 Jahre, 2% = 50 Jahre
    
    if (taxYear > purchaseYear + afaDuration) {
        return 0; // AfA bereits abgelaufen
    }
    
    return buildingValue * (afaRate / 100);
}

function getAfARate(building) {
    const buildYear = building.year_built || new Date(building.purchase_date || Date.now()).getFullYear();
    
    if (buildYear < 1925) {
        return 2.5;
    } else if (buildYear >= 2023) {
        return 3.0; // Degressive AfA für Neubauten ab 2023
    }
    
    return 2.0; // Standard
}