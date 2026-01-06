import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Intelligente Aktualisierung bestehender Buchungen
 * Matching-Algorithmus mit 7-Tage-Toleranz
 * Erhält Verknüpfungen zu Transaktionen und Zahlungen
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { source_type, source_id, new_bookings, old_source_id } = await req.json();

        if (!source_type || !source_id || !new_bookings) {
            return Response.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
        }

        // Lade bestehende Buchungen aus der alten Quelle
        const existingBookings = await base44.entities.GeneratedFinancialBooking.filter({
            source_type: source_type,
            source_id: old_source_id || source_id
        });

        const matched = [];
        const newToCreate = [];
        const toDelete = [];
        const unchanged = [];

        // Matching-Algorithmus
        const usedExistingIds = new Set();

        for (const newBooking of new_bookings) {
            const newDate = new Date(newBooking.due_date);
            
            // Suche passende bestehende Buchung (7-Tage-Toleranz)
            const matchingExisting = existingBookings.find(existing => {
                if (usedExistingIds.has(existing.id)) return false;
                
                const existingDate = new Date(existing.due_date);
                const daysDiff = Math.abs((newDate - existingDate) / (1000 * 60 * 60 * 24));
                
                return daysDiff <= 7;
            });

            if (matchingExisting) {
                usedExistingIds.add(matchingExisting.id);
                
                // Prüfe auf Änderungen
                const dateChanged = matchingExisting.due_date !== newBooking.due_date;
                const amountChanged = Math.abs(matchingExisting.amount - newBooking.amount) > 0.01;
                
                if (dateChanged || amountChanged) {
                    matched.push({
                        booking_id: matchingExisting.id,
                        old_due_date: matchingExisting.due_date,
                        new_due_date: newBooking.due_date,
                        old_amount: matchingExisting.amount,
                        new_amount: newBooking.amount,
                        changes: {
                            date_changed: dateChanged,
                            amount_changed: amountChanged
                        },
                        linked_transactions: matchingExisting.linked_transaction_ids || [],
                        linked_payments: matchingExisting.linked_payment_ids || [],
                        paid_amount: matchingExisting.paid_amount || 0,
                        status: matchingExisting.booking_status,
                        description: newBooking.description,
                        cost_category_id: newBooking.cost_category_id,
                        unit_id: newBooking.unit_id
                    });
                } else {
                    unchanged.push({
                        booking_id: matchingExisting.id,
                        due_date: matchingExisting.due_date,
                        amount: matchingExisting.amount,
                        description: matchingExisting.description
                    });
                }
            } else {
                // Keine passende Buchung gefunden
                newToCreate.push(newBooking);
            }
        }

        // Identifiziere zu löschende Buchungen
        for (const existing of existingBookings) {
            if (!usedExistingIds.has(existing.id) &&
                existing.booking_status === 'Geplant' &&
                (existing.paid_amount || 0) === 0) {
                toDelete.push({
                    booking_id: existing.id,
                    due_date: existing.due_date,
                    amount: existing.amount,
                    description: existing.description
                });
            }
        }

        return Response.json({
            success: true,
            summary: {
                to_update: matched.length,
                to_create: newToCreate.length,
                to_delete: toDelete.length,
                unchanged: unchanged.length,
                total_existing: existingBookings.length
            },
            to_update: matched,
            to_create: newToCreate,
            to_delete: toDelete,
            unchanged: unchanged
        });

    } catch (error) {
        console.error('Update existing bookings error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});