import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Dreistufige Validierung der Anlage V Daten
 * Stufe 1: Kritische Fehler (Abbruch)
 * Stufe 2: Warnungen (Plausibilität)
 * Stufe 3: Hinweise (Optimierung)
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { form_data, building_id } = await req.json();

        if (!form_data) {
            return Response.json({ error: 'form_data erforderlich' }, { status: 400 });
        }

        // Gebäude laden für Kontext
        let building = null;
        if (building_id) {
            const buildings = await base44.entities.Building.filter({ id: building_id });
            building = buildings.length > 0 ? buildings[0] : null;
        }

        // STUFE 1: Kritische Fehler
        const kritischeFehler = [];

        // Pflichtfelder prüfen
        if (!form_data.zeile_4 || !form_data.zeile_4.trim()) {
            kritischeFehler.push({
                severity: 'critical',
                field: 'zeile_4',
                message: 'Objektadresse (Straße, Hausnummer) fehlt',
                fix: 'Tragen Sie die vollständige Adresse ein'
            });
        }

        if (!form_data.zeile_5 || !form_data.zeile_5.trim()) {
            kritischeFehler.push({
                severity: 'critical',
                field: 'zeile_5',
                message: 'PLZ und Ort fehlen',
                fix: 'Tragen Sie Postleitzahl und Ort ein'
            });
        }

        if (!form_data.zeile_7) {
            kritischeFehler.push({
                severity: 'critical',
                field: 'zeile_7',
                message: 'Anschaffungs-/Fertigstellungsdatum fehlt',
                fix: 'Erforderlich für AfA-Berechnung'
            });
        }

        if (!form_data.zeile_10 || form_data.zeile_10 === 0) {
            kritischeFehler.push({
                severity: 'critical',
                field: 'zeile_10',
                message: 'Gesamtwohnfläche fehlt',
                fix: 'Geben Sie die Wohnfläche in m² an'
            });
        }

        // AfA-Berechnung prüfen
        if (form_data.zeile_33 && building) {
            const expectedAfa = calculateExpectedAfA(building, form_data.zeile_7);
            const diff = Math.abs(form_data.zeile_33 - expectedAfa);
            if (diff > expectedAfa * 0.1) { // >10% Abweichung
                kritischeFehler.push({
                    severity: 'critical',
                    field: 'zeile_33',
                    message: 'AfA-Betrag weicht stark von Erwartung ab',
                    expected: expectedAfa,
                    actual: form_data.zeile_33,
                    fix: 'Prüfen Sie Kaufpreis und AfA-Satz'
                });
            }
        }

        // STUFE 2: Warnungen
        const warnungen = [];

        // Einnahmen vs. Ausgaben
        const einnahmen = form_data.zeile_32 || 0;
        const ausgaben = form_data.zeile_82 || 0;

        if (ausgaben > einnahmen * 3) {
            warnungen.push({
                severity: 'warning',
                message: 'Ausgaben außergewöhnlich hoch im Verhältnis zu Einnahmen',
                detail: `Ausgaben: ${ausgaben}€, Einnahmen: ${einnahmen}€`,
                impact: 'Kann zu Nachfragen vom Finanzamt führen'
            });
        }

        // Umlagen-Plausibilität
        if (form_data.zeile_20 && form_data.zeile_20 > einnahmen * 0.5) {
            warnungen.push({
                severity: 'warning',
                message: 'Umlagen erscheinen sehr hoch',
                detail: `Umlagen: ${form_data.zeile_20}€ (${Math.round(form_data.zeile_20/einnahmen*100)}% der Einnahmen)`,
                impact: 'Typisch sind 15-25% der Kaltmiete'
            });
        }

        // Soll vs. Ist-Miete Differenz
        if (form_data.zeile_13 && form_data.zeile_14) {
            const diff = form_data.zeile_13 - form_data.zeile_14;
            if (diff > form_data.zeile_13 * 0.1) { // >10% Differenz
                warnungen.push({
                    severity: 'warning',
                    message: 'Mietausfälle über 10%',
                    detail: `Soll: ${form_data.zeile_13}€, Ist: ${form_data.zeile_14}€, Differenz: ${diff}€`,
                    impact: 'Prüfen Sie Mietrückstände und dokumentieren Sie diese'
                });
            }
        }

        // Erhaltungsaufwendungen prüfen
        if (form_data.zeile_48 && form_data.zeile_48 > 4000) {
            warnungen.push({
                severity: 'warning',
                message: 'Erhaltungsaufwendungen > 4.000€',
                detail: `Betrag: ${form_data.zeile_48}€`,
                impact: 'Prüfen Sie ob Verteilung auf 5 Jahre sinnvoll ist (Zeile 49)',
                hint: 'Bei größeren Maßnahmen kann Verteilung steuerlich günstiger sein'
            });
        }

        // STUFE 3: Optimierungshinweise
        const hinweise = [];

        // Degressive AfA prüfen
        if (building && building.year_built >= 2023) {
            const currentRate = getAfARateFromAmount(form_data.zeile_33, building.purchase_price);
            if (currentRate < 3.0) {
                hinweise.push({
                    severity: 'info',
                    category: 'optimization',
                    message: 'Degressive AfA für Neubau ab 2023 möglich',
                    detail: 'Sie können 3% statt 2% AfA nutzen',
                    potential_savings: calculateAfASavings(building, 2.0, 3.0),
                    action: 'Prüfen Sie degressive AfA (3% für 4 Jahre, dann 2%)'
                });
            }
        }

        // Sonderabschreibungen
        if (!form_data.zeile_37 && building) {
            const eligibleFor7b = checkEligibilityPara7b(building);
            if (eligibleFor7b) {
                hinweise.push({
                    severity: 'info',
                    category: 'optimization',
                    message: 'Sonderabschreibung nach §7b EStG möglich',
                    detail: 'Bis zu 28% in ersten 4 Jahren bei Mietwohnungsneubau',
                    action: 'Prüfen Sie Voraussetzungen für §7b-Förderung'
                });
            }
        }

        // Verbilligte Vermietung prüfen (66%-Regel)
        if (form_data.zeile_15 && building) {
            const ortsüblicheVergleichsmiete = estimateVergleichsmiete(building);
            const vereinbarteMiete = form_data.zeile_15 / 12; // Jahresmiete → Monatsmiete
            
            if (vereinbarteMiete < ortsüblicheVergleichsmiete * 0.66) {
                hinweise.push({
                    severity: 'info',
                    category: 'attention',
                    message: 'Verbilligte Vermietung - Werbungskosten können gekürzt werden',
                    detail: `Vereinbart: ${vereinbarteMiete}€/Monat, geschätzt ortsüblich: ${ortsüblicheVergleichsmiete}€/Monat`,
                    impact: `Bei <66% der ortsüblichen Miete sind Werbungskosten nur anteilig absetzbar`,
                    action: 'Prüfen Sie Zeile 87-88 und führen Sie ggf. Kürzung durch'
                });
            }
        }

        // Zinsen vs. Tilgung
        if (form_data.zeile_39 && form_data.zeile_39 > 0) {
            hinweise.push({
                severity: 'info',
                category: 'info',
                message: 'Nur Zinsen sind absetzbar',
                detail: 'Tilgungsleistungen sind nicht als Werbungskosten absetzbar',
                action: 'Achten Sie darauf, nur Zinszahlungen anzugeben'
            });
        }

        // Gesamtergebnis
        const isValid = kritischeFehler.length === 0;
        const status = kritischeFehler.length > 0 ? 'invalid' : 
                      warnungen.length > 0 ? 'warning' : 'valid';

        return Response.json({
            success: true,
            validation: {
                status: status,
                is_valid: isValid,
                can_submit: isValid,
                summary: {
                    critical_errors: kritischeFehler.length,
                    warnings: warnungen.length,
                    hints: hinweise.length
                }
            },
            kritische_fehler: kritischeFehler,
            warnungen: warnungen,
            hinweise: hinweise,
            validated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Validation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateExpectedAfA(building, purchaseDate) {
    if (!building.purchase_price) return 0;
    
    const buildYear = building.year_built || new Date(purchaseDate).getFullYear();
    let rate = 2.0;
    
    if (buildYear < 1925) rate = 2.5;
    else if (buildYear >= 2023) rate = 3.0;
    
    return (building.purchase_price * 0.8) * (rate / 100);
}

function getAfARateFromAmount(afaAmount, purchasePrice) {
    if (!purchasePrice || purchasePrice === 0) return 0;
    return (afaAmount / (purchasePrice * 0.8)) * 100;
}

function calculateAfASavings(building, currentRate, newRate) {
    const buildingValue = (building.purchase_price || 0) * 0.8;
    return buildingValue * ((newRate - currentRate) / 100);
}

function checkEligibilityPara7b(building) {
    // Vereinfachte Prüfung - in Realität komplexer
    return building.year_built >= 2023 && 
           building.usage_type === 'WOHNUNG';
}

function estimateVergleichsmiete(building) {
    // Sehr vereinfacht - in Realität aus Mietspiegel
    const sqm = building.total_sqm || 100;
    const basePrice = 12; // €/m² als Durchschnitt
    return sqm * basePrice;
}