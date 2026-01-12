import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Export bookings to DATEV-compatible CSV format
 * Format: Kontotyp|Konto|Gegenkonto|Belegdatum|Buchungstext|Betrag|...
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { buildingId, startDate, endDate } = await req.json();

        if (!buildingId || !startDate || !endDate) {
            return Response.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Get all bookings (SOLL and IST) for date range
        const bookings = await base44.entities.PlannedBooking.list(
            'booking_date',
            5000,
            {
                building_id: buildingId,
                booking_date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        );

        // Get actual payments for IST bookings
        const payments = await base44.entities.ActualPayment.list(
            'payment_date',
            5000,
            {
                building_id: buildingId,
                payment_date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        );

        // Build DATEV CSV
        const lines = [];
        lines.push('Datev-Export|FinX|' + new Date().toISOString().split('T')[0]);
        lines.push('Kontotyp|Konto|Gegenkonto|Belegdatum|Buchungstext|Betrag|Währung|Kostenstelle');

        // Add SOLL bookings (Miete, Nebenkosten, etc.)
        if (bookings?.length) {
            for (const booking of bookings) {
                const kontotyp = booking.booking_type === 'SOLL' ? 'A' : 'E'; // A=Ausgang, E=Eingang
                const konto = booking.cost_category_id || '4100'; // Default rent account
                const gegenkonto = '1200'; // Tenant receivable
                const belegdatum = booking.booking_date;
                const buchungstext = booking.description || `${booking.booking_type} ${booking.month}`;
                const betrag = booking.amount;

                lines.push(
                    `${kontotyp}|${konto}|${gegenkonto}|${belegdatum}|${buchungstext}|${betrag}|EUR|`
                );
            }
        }

        // Add IST bookings (actual payments)
        if (payments?.length) {
            for (const payment of payments) {
                const belegdatum = payment.payment_date;
                const buchungstext = `Zahlung ${payment.reference}`;
                const betrag = payment.amount;
                const konto = '1200'; // Bank account
                const gegenkonto = '4100'; // Rent received

                lines.push(
                    `A|${konto}|${gegenkonto}|${belegdatum}|${buchungstext}|${betrag}|EUR|`
                );
            }
        }

        const csv = lines.join('\n');

        // Upload CSV file
        const uploadRes = await base44.integrations.Core.UploadFile({
            file: csv
        });

        return Response.json({
            success: true,
            bookingsExported: bookings?.length || 0,
            paymentsExported: payments?.length || 0,
            fileUrl: uploadRes.file_url,
            exportDate: new Date().toISOString(),
            format: 'DATEV-CSV'
        });

    } catch (error) {
        console.error('Error exporting to DATEV:', error.message);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});