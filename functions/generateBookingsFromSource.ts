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

                // Quartalsraten generieren
                const quarterlyAmount = sourceData.grundsteuer_quartalsrate || (sourceData.grundsteuer_jahresbetrag / 4);
                
                if (sourceData.faelligkeit_q1) {
                    bookingSuggestions.push({
                        due_date: sourceData.faelligkeit_q1,
                        amount: quarterlyAmount,
                        description: `Grundsteuer ${sourceData.grundsteuerbescheid_jahr} - 1. Rate (Q1)`,
                        cost_category_suggestion: 'Grundsteuer'
                    });
                }
                if (sourceData.faelligkeit_q2) {
                    bookingSuggestions.push({
                        due_date: sourceData.faelligkeit_q2,
                        amount: quarterlyAmount,
                        description: `Grundsteuer ${sourceData.grundsteuerbescheid_jahr} - 2. Rate (Q2)`,
                        cost_category_suggestion: 'Grundsteuer'
                    });
                }
                if (sourceData.faelligkeit_q3) {
                    bookingSuggestions.push({
                        due_date: sourceData.faelligkeit_q3,
                        amount: quarterlyAmount,
                        description: `Grundsteuer ${sourceData.grundsteuerbescheid_jahr} - 3. Rate (Q3)`,
                        cost_category_suggestion: 'Grundsteuer'
                    });
                }
                if (sourceData.faelligkeit_q4) {
                    bookingSuggestions.push({
                        due_date: sourceData.faelligkeit_q4,
                        amount: quarterlyAmount,
                        description: `Grundsteuer ${sourceData.grundsteuerbescheid_jahr} - 4. Rate (Q4)`,
                        cost_category_suggestion: 'Grundsteuer'
                    });
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

                let numberOfPayments = 1;
                let amountPerPayment = yearlyAmount;
                let monthsBetween = 12;

                switch (paymentMethod) {
                    case 'monatlich':
                        numberOfPayments = 12;
                        amountPerPayment = yearlyAmount / 12;
                        monthsBetween = 1;
                        break;
                    case 'vierteljährlich':
                        numberOfPayments = 4;
                        amountPerPayment = yearlyAmount / 4;
                        monthsBetween = 3;
                        break;
                    case 'halbjährlich':
                        numberOfPayments = 2;
                        amountPerPayment = yearlyAmount / 2;
                        monthsBetween = 6;
                        break;
                    case 'jährlich':
                        numberOfPayments = 1;
                        amountPerPayment = yearlyAmount;
                        monthsBetween = 12;
                        break;
                }

                // Generiere erste 12 Monate Buchungen
                for (let i = 0; i < numberOfPayments; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(dueDate.getMonth() + (i * monthsBetween));
                    
                    bookingSuggestions.push({
                        due_date: dueDate.toISOString().split('T')[0],
                        amount: amountPerPayment,
                        description: `${sourceData.versicherungstyp} - ${paymentMethod} Rate ${i + 1}`,
                        cost_category_suggestion: sourceData.versicherungstyp
                    });
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
                const zinssatz = sourceData.zinssatz / 100;
                const tilgungssatz = sourceData.tilgungssatz / 100;
                const kreditbetrag = sourceData.kreditbetrag;

                // Generiere erste 12 Monate (später mehr über Zukunftsgenerierung)
                for (let i = 0; i < Math.min(12, laufzeitMonate); i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(dueDate.getMonth() + i);

                    // Vereinfachte Berechnung (annuitätisch)
                    const restschuld = kreditbetrag * Math.pow(1 + zinssatz / 12, i) - 
                                      (monthlyRate * (Math.pow(1 + zinssatz / 12, i) - 1) / (zinssatz / 12));
                    const zinsen = restschuld * (zinssatz / 12);
                    const tilgung = monthlyRate - zinsen;

                    // Tilgung
                    bookingSuggestions.push({
                        due_date: dueDate.toISOString().split('T')[0],
                        amount: tilgung,
                        description: `Kreditrate ${i + 1} - Tilgung`,
                        cost_category_suggestion: 'Darlehen-Tilgung (nicht abzugsfähig)'
                    });

                    // Zinsen
                    bookingSuggestions.push({
                        due_date: dueDate.toISOString().split('T')[0],
                        amount: zinsen,
                        description: `Kreditrate ${i + 1} - Zinsen`,
                        cost_category_suggestion: 'Schuldzinsen'
                    });
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

                let numberOfPayments = 12;
                let amountPerPayment = amount;
                let monthsBetween = 1;

                switch (rhythm) {
                    case 'Monatlich':
                        numberOfPayments = 12;
                        amountPerPayment = amount;
                        monthsBetween = 1;
                        break;
                    case 'Vierteljährlich':
                        numberOfPayments = 4;
                        amountPerPayment = amount;
                        monthsBetween = 3;
                        break;
                    case 'Halbjährlich':
                        numberOfPayments = 2;
                        amountPerPayment = amount;
                        monthsBetween = 6;
                        break;
                    case 'Jährlich':
                        numberOfPayments = 1;
                        amountPerPayment = amount;
                        monthsBetween = 12;
                        break;
                }

                for (let i = 0; i < numberOfPayments; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(dueDate.getMonth() + (i * monthsBetween));
                    
                    bookingSuggestions.push({
                        due_date: dueDate.toISOString().split('T')[0],
                        amount: amountPerPayment,
                        description: `${sourceData.supplier_type} - ${sourceData.name} - Rate ${i + 1}`,
                        cost_category_suggestion: sourceData.supplier_type
                    });
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
                const endDate = sourceData.end_date ? new Date(sourceData.end_date) : null;
                const rentDueDay = sourceData.rent_due_day || 1;

                // Generiere 12 Monate Mietzahlungen
                const monthsToGenerate = endDate ? 
                    Math.min(12, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30))) : 12;

                for (let i = 0; i < monthsToGenerate; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(dueDate.getMonth() + i);
                    dueDate.setDate(rentDueDay);

                    bookingSuggestions.push({
                        due_date: dueDate.toISOString().split('T')[0],
                        amount: sourceData.total_rent,
                        description: `Miete ${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`,
                        cost_category_suggestion: 'Mieteinnahmen',
                        unit_id: sourceData.unit_id
                    });
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