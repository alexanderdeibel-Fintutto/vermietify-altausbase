import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generiert automatisch zukünftige Buchungen
 * Läuft täglich als Scheduled Task
 * 90-Tage-Vorausschau
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Service-Role für Scheduled Task
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 90);

        const createdBookings = [];
        const errors = [];

        // Lade alle aktiven Generierungsregeln
        const rules = await base44.asServiceRole.entities.BookingGenerationRule.filter({
            is_active: true
        });

        for (const rule of rules) {
            try {
                // Lade Quelldaten um zu prüfen ob noch aktuell
                let sourceIsValid = false;
                
                switch (rule.source_type) {
                    case 'Grundsteuer': {
                        const sources = await base44.asServiceRole.entities.PropertyTax.filter({
                            id: rule.source_id
                        });
                        sourceIsValid = sources.length > 0 && sources[0].is_current_valid;
                        break;
                    }
                    case 'Versicherung': {
                        const sources = await base44.asServiceRole.entities.Insurance.filter({
                            id: rule.source_id
                        });
                        sourceIsValid = sources.length > 0 && sources[0].is_current_valid;
                        break;
                    }
                    case 'Kredit': {
                        const sources = await base44.asServiceRole.entities.Financing.filter({
                            id: rule.source_id
                        });
                        sourceIsValid = sources.length > 0 && sources[0].is_current_valid;
                        break;
                    }
                    case 'Versorger': {
                        const sources = await base44.asServiceRole.entities.Supplier.filter({
                            id: rule.source_id
                        });
                        sourceIsValid = sources.length > 0 && sources[0].is_current_valid;
                        break;
                    }
                    case 'Mietvertrag': {
                        const sources = await base44.asServiceRole.entities.LeaseContract.filter({
                            id: rule.source_id
                        });
                        sourceIsValid = sources.length > 0 && sources[0].is_current_valid;
                        break;
                    }
                }

                if (!sourceIsValid) {
                    continue; // Quelle nicht mehr gültig, überspringe
                }

                // Finde letzte generierte Buchung für diese Regel
                const existingBookings = await base44.asServiceRole.entities.GeneratedFinancialBooking.filter({
                    source_type: rule.source_type,
                    source_id: rule.source_id
                });

                if (existingBookings.length === 0) {
                    continue; // Keine Buchungen vorhanden
                }

                // Sortiere nach Fälligkeitsdatum
                existingBookings.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
                const lastBooking = existingBookings[0];
                const lastDueDate = new Date(lastBooking.due_date);

                // Berechne nächste Fälligkeit basierend auf Rhythmus
                let nextDueDate = new Date(lastDueDate);
                
                switch (rule.rhythm) {
                    case 'Monatlich':
                        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                        break;
                    case 'Vierteljährlich':
                        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
                        break;
                    case 'Halbjährlich':
                        nextDueDate.setMonth(nextDueDate.getMonth() + 6);
                        break;
                    case 'Jährlich':
                        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                        break;
                    case 'Einmalig':
                        continue; // Keine weiteren Buchungen
                }

                // Prüfe ob nächste Fälligkeit in den nächsten 90 Tagen liegt
                if (nextDueDate <= futureDate) {
                    // Prüfe ob Buchung bereits existiert
                    const existingForDate = existingBookings.find(b => 
                        b.due_date === nextDueDate.toISOString().split('T')[0]
                    );

                    if (!existingForDate) {
                        // Erstelle neue Buchung
                        const newBooking = await base44.asServiceRole.entities.GeneratedFinancialBooking.create({
                            building_id: lastBooking.building_id,
                            unit_id: lastBooking.unit_id,
                            source_type: rule.source_type,
                            source_id: rule.source_id,
                            source_version: lastBooking.source_version,
                            due_date: nextDueDate.toISOString().split('T')[0],
                            original_due_date: nextDueDate.toISOString().split('T')[0],
                            amount: rule.amount_per_booking,
                            original_amount: rule.amount_per_booking,
                            cost_category_id: rule.cost_category_id,
                            description: lastBooking.description.replace(/\d+/, String(parseInt(lastBooking.description.match(/\d+/)?.[0] || '0') + 1)),
                            booking_status: 'Geplant',
                            paid_amount: 0,
                            outstanding_amount: rule.amount_per_booking,
                            linked_transaction_ids: [],
                            linked_payment_ids: [],
                            is_automatically_created: true,
                            is_future_booking: true,
                            last_updated: new Date().toISOString(),
                            changed_by: 'System-Zukunftsgenerierung',
                            is_cancelled: false
                        });

                        createdBookings.push({
                            booking_id: newBooking.id,
                            source_type: rule.source_type,
                            source_id: rule.source_id,
                            due_date: nextDueDate.toISOString().split('T')[0],
                            amount: rule.amount_per_booking
                        });
                    }
                }

            } catch (error) {
                errors.push({
                    rule_id: rule.id,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            generated_count: createdBookings.length,
            processed_rules: rules.length,
            errors_count: errors.length,
            created_bookings: createdBookings,
            errors: errors,
            executed_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Generate future bookings error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});