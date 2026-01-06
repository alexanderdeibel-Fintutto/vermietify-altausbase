import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generiert Buchungsvorschläge aus verschiedenen Quellen
 * Eingabe: source_type, source_id
 * Ausgabe: Array von Buchungsvorschlägen
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { source_type, source_id } = await req.json();
        
        console.log('Generate bookings request:', { source_type, source_id });

        if (!source_type || !source_id) {
            return Response.json({ error: 'source_type und source_id erforderlich' }, { status: 400 });
        }

        let bookingSuggestions = [];
        let sourceData = null;
        let buildingId = null;

        // Lade Quelldaten basierend auf Typ
        switch (source_type) {
            case 'Grundsteuer': {
                const sources = await base44.entities.PropertyTax.filter({ id: source_id });
                if (sources.length === 0) {
                    return Response.json({ error: 'Grundsteuerbescheid nicht gefunden' }, { status: 404 });
                }
                sourceData = sources[0];
                buildingId = sourceData.building_id;

                const quarterlyAmount = sourceData.grundsteuer_quartalsrate || (sourceData.grundsteuer_jahresbetrag / 4);
                const baseYear = sourceData.grundsteuerbescheid_jahr;
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1); // Heute + 1 Jahr
                
                // Alle Quartale vom Bescheidjahr bis heute + 1 Jahr
                const quarterDates = [
                    { date: sourceData.faelligkeit_q1, quarter: 'Q1' },
                    { date: sourceData.faelligkeit_q2, quarter: 'Q2' },
                    { date: sourceData.faelligkeit_q3, quarter: 'Q3' },
                    { date: sourceData.faelligkeit_q4, quarter: 'Q4' }
                ];
                
                let currentYear = baseYear;
                while (currentYear <= endDate.getFullYear() + 1) {
                    for (const q of quarterDates) {
                        if (!q.date) continue;
                        
                        const baseDate = new Date(q.date);
                        const dueDate = new Date(currentYear, baseDate.getMonth(), baseDate.getDate());
                        
                        if (dueDate <= endDate) {
                            bookingSuggestions.push({
                                due_date: dueDate.toISOString().split('T')[0],
                                amount: quarterlyAmount,
                                description: `Grundsteuer ${currentYear} - ${q.quarter}`,
                                cost_category_suggestion: 'Grundsteuer'
                            });
                        }
                    }
                    currentYear++;
                }
                break;
            }

            case 'Versicherung': {
                const sources = await base44.entities.Insurance.filter({ id: source_id });
                if (sources.length === 0) {
                    return Response.json({ error: 'Versicherung nicht gefunden' }, { status: 404 });
                }
                sourceData = sources[0];
                buildingId = sourceData.building_id;

                if (!sourceData.praemie_jaehrlich) {
                    return Response.json({ error: 'Jährliche Prämie fehlt' }, { status: 400 });
                }

                const yearlyAmount = sourceData.praemie_jaehrlich;
                const paymentMethod = sourceData.zahlungsweise || 'jährlich';
                const startDate = sourceData.vertragsbeginn ? new Date(sourceData.vertragsbeginn) : new Date();
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1); // Heute + 1 Jahr

                let amountPerPayment = yearlyAmount;
                let monthsBetween = 12;

                switch (paymentMethod) {
                    case 'monatlich':
                        amountPerPayment = yearlyAmount / 12;
                        monthsBetween = 1;
                        break;
                    case 'vierteljährlich':
                        amountPerPayment = yearlyAmount / 4;
                        monthsBetween = 3;
                        break;
                    case 'halbjährlich':
                        amountPerPayment = yearlyAmount / 2;
                        monthsBetween = 6;
                        break;
                    case 'jährlich':
                        amountPerPayment = yearlyAmount;
                        monthsBetween = 12;
                        break;
                }

                // Generiere Buchungen vom Vertragsbeginn bis 1 Jahr in die Zukunft
                let currentDate = new Date(startDate);
                let rateNumber = 1;
                
                while (currentDate <= endDate) {
                    bookingSuggestions.push({
                        due_date: currentDate.toISOString().split('T')[0],
                        amount: amountPerPayment,
                        description: `${sourceData.versicherungstyp} - ${paymentMethod} Rate ${rateNumber}`,
                        cost_category_suggestion: sourceData.versicherungstyp
                    });
                    
                    currentDate = new Date(currentDate);
                    currentDate.setMonth(currentDate.getMonth() + monthsBetween);
                    rateNumber++;
                }
                break;
            }

            case 'Kredit': {
                const sources = await base44.entities.Financing.filter({ id: source_id });
                if (sources.length === 0) {
                    return Response.json({ error: 'Finanzierung nicht gefunden' }, { status: 404 });
                }
                sourceData = sources[0];
                buildingId = sourceData.building_id;

                const monthlyRate = sourceData.monatsrate;
                const laufzeitMonate = sourceData.laufzeit_monate;
                const startDate = new Date(sourceData.vertragsbeginn);
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1); // Heute + 1 Jahr
                const zinssatz = sourceData.zinssatz / 100;
                const kreditbetrag = sourceData.kreditbetrag;

                // Generiere vom Vertragsbeginn bis heute + 1 Jahr
                let i = 0;
                let currentDate = new Date(startDate);
                
                while (currentDate <= endDate && i < laufzeitMonate) {
                    // Vereinfachte Berechnung (annuitätisch)
                    const restschuld = kreditbetrag * Math.pow(1 + zinssatz / 12, i) - 
                                      (monthlyRate * (Math.pow(1 + zinssatz / 12, i) - 1) / (zinssatz / 12));
                    const zinsen = restschuld * (zinssatz / 12);
                    const tilgung = monthlyRate - zinsen;

                    // Tilgung
                    bookingSuggestions.push({
                        due_date: currentDate.toISOString().split('T')[0],
                        amount: tilgung,
                        description: `Kreditrate ${i + 1} - Tilgung`,
                        cost_category_suggestion: 'Darlehen-Tilgung (nicht abzugsfähig)'
                    });

                    // Zinsen
                    bookingSuggestions.push({
                        due_date: currentDate.toISOString().split('T')[0],
                        amount: zinsen,
                        description: `Kreditrate ${i + 1} - Zinsen`,
                        cost_category_suggestion: 'Schuldzinsen'
                    });
                    
                    currentDate = new Date(currentDate);
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    i++;
                }
                break;
            }

            case 'Versorger': {
                const sources = await base44.entities.Supplier.filter({ id: source_id });
                if (sources.length === 0) {
                    return Response.json({ error: 'Versorger nicht gefunden' }, { status: 404 });
                }
                sourceData = sources[0];
                buildingId = sourceData.building_id;

                const amount = sourceData.monthly_amount;
                const rhythm = sourceData.payment_rhythm || 'Monatlich';
                const startDate = sourceData.contract_date ? new Date(sourceData.contract_date) : new Date();
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1); // Heute + 1 Jahr

                let amountPerPayment = amount;
                let monthsBetween = 1;

                switch (rhythm) {
                    case 'Monatlich':
                        amountPerPayment = amount;
                        monthsBetween = 1;
                        break;
                    case 'Vierteljährlich':
                        amountPerPayment = amount;
                        monthsBetween = 3;
                        break;
                    case 'Halbjährlich':
                        amountPerPayment = amount;
                        monthsBetween = 6;
                        break;
                    case 'Jährlich':
                        amountPerPayment = amount;
                        monthsBetween = 12;
                        break;
                }

                let currentDate = new Date(startDate);
                let rateNumber = 1;
                
                while (currentDate <= endDate) {
                    bookingSuggestions.push({
                        due_date: currentDate.toISOString().split('T')[0],
                        amount: amountPerPayment,
                        description: `${sourceData.supplier_type} - ${sourceData.name} - Rate ${rateNumber}`,
                        cost_category_suggestion: sourceData.supplier_type
                    });
                    
                    currentDate = new Date(currentDate);
                    currentDate.setMonth(currentDate.getMonth() + monthsBetween);
                    rateNumber++;
                }
                break;
            }

            case 'Mietvertrag': {
                const sources = await base44.entities.LeaseContract.filter({ id: source_id });
                if (sources.length === 0) {
                    return Response.json({ error: 'Mietvertrag nicht gefunden' }, { status: 404 });
                }
                sourceData = sources[0];
                
                // Unit laden für building_id
                const units = await base44.entities.Unit.filter({ id: sourceData.unit_id });
                if (units.length > 0) {
                    buildingId = units[0].building_id;
                }

                const startDate = new Date(sourceData.start_date);
                const contractEndDate = sourceData.end_date ? new Date(sourceData.end_date) : null;
                const futureEndDate = new Date();
                futureEndDate.setFullYear(futureEndDate.getFullYear() + 1); // Heute + 1 Jahr
                const endDate = contractEndDate && contractEndDate < futureEndDate ? contractEndDate : futureEndDate;
                const rentDueDay = sourceData.rent_due_day || 1;

                // Generiere vom Vertragsbeginn bis heute + 1 Jahr (oder Vertragsende, falls früher)
                let currentDate = new Date(startDate);
                currentDate.setDate(rentDueDay);
                
                while (currentDate <= endDate) {
                    bookingSuggestions.push({
                        due_date: currentDate.toISOString().split('T')[0],
                        amount: sourceData.total_rent,
                        description: `Miete ${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
                        cost_category_suggestion: 'Mieteinnahmen',
                        unit_id: sourceData.unit_id
                    });
                    
                    currentDate = new Date(currentDate);
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
                break;
            }

            default:
                return Response.json({ error: 'Unbekannter source_type' }, { status: 400 });
        }

        return Response.json({
            success: true,
            source_type,
            source_id,
            building_id: buildingId,
            source_data: sourceData,
            booking_suggestions: bookingSuggestions,
            count: bookingSuggestions.length
        });

    } catch (error) {
        console.error('Generate bookings error:', error);
        console.error('Error stack:', error.stack);
        return Response.json({ 
            error: error.message,
            stack: error.stack,
            details: error.toString()
        }, { status: 500 });
    }
});