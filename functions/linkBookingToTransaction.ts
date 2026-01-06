import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Verknüpft eine generierte Buchung mit einer Banktransaktion
 * Berechnet Status basierend auf Zahlungen
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id, transaction_id, paid_amount } = await req.json();

        if (!booking_id) {
            return Response.json({ error: 'booking_id erforderlich' }, { status: 400 });
        }

        // Lade Buchung
        const bookings = await base44.entities.GeneratedFinancialBooking.filter({ id: booking_id });
        if (bookings.length === 0) {
            return Response.json({ error: 'Buchung nicht gefunden' }, { status: 404 });
        }

        const booking = bookings[0];
        
        // Aktualisiere Verknüpfungen
        const linkedTransactionIds = booking.linked_transaction_ids || [];
        const linkedPaymentIds = booking.linked_payment_ids || [];

        if (transaction_id && !linkedTransactionIds.includes(transaction_id)) {
            linkedTransactionIds.push(transaction_id);
        }

        // Berechne bezahlten Betrag
        let totalPaid = booking.paid_amount || 0;
        if (paid_amount) {
            totalPaid += paid_amount;
        }

        // Berechne Status
        let newStatus = 'Geplant';
        if (totalPaid > 0) {
            if (totalPaid >= booking.amount) {
                newStatus = 'Bezahlt';
            } else {
                newStatus = 'TeilweiseBezahlt';
            }
        }

        const outstandingAmount = Math.max(0, booking.amount - totalPaid);

        // Aktualisiere Buchung
        await base44.entities.GeneratedFinancialBooking.update(booking_id, {
            linked_transaction_ids: linkedTransactionIds,
            linked_payment_ids: linkedPaymentIds,
            paid_amount: totalPaid,
            outstanding_amount: outstandingAmount,
            booking_status: newStatus,
            last_updated: new Date().toISOString(),
            changed_by: 'System-Verknüpfung'
        });

        // Wenn Transaktion verknüpft, aktualisiere auch Transaktion
        if (transaction_id) {
            const transactions = await base44.entities.BankTransaction.filter({ id: transaction_id });
            if (transactions.length > 0) {
                const transaction = transactions[0];
                await base44.entities.BankTransaction.update(transaction_id, {
                    notes: (transaction.notes || '') + 
                           `\n[System] Verknüpft mit generierter Buchung: ${booking.description} am ${new Date().toISOString()}`
                });
            }
        }

        return Response.json({
            success: true,
            booking_id,
            new_status: newStatus,
            paid_amount: totalPaid,
            outstanding_amount: outstandingAmount,
            linked_transactions: linkedTransactionIds.length,
            linked_payments: linkedPaymentIds.length
        });

    } catch (error) {
        console.error('Link booking error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});