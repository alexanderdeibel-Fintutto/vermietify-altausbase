import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Updates future bookings when a lease contract is modified
 * Called automatically when LeaseContract is updated
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { contractId, oldRent, newRent, changeDate } = await req.json();

        if (!contractId || !oldRent || !newRent) {
            return Response.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Get the contract to find unit and building
        const contract = await base44.entities.LeaseContract.list(
            '-updated_date',
            1,
            { id: contractId }
        );

        if (!contract?.length) {
            return Response.json({ error: 'Contract not found' }, { status: 404 });
        }

        const leaseContract = contract[0];
        const changeDateObj = new Date(changeDate || new Date());

        // Find all future SOLL bookings for this contract
        const futureBookings = await base44.entities.PlannedBooking.list(
            'booking_date',
            1000,
            {
                lease_contract_id: contractId,
                booking_date: { $gte: changeDateObj.toISOString().split('T')[0] },
                booking_type: 'SOLL'
            }
        );

        if (!futureBookings?.length) {
            console.log(`No future bookings found for contract ${contractId}`);
            return Response.json({ updated: 0 });
        }

        const rentDifference = newRent - oldRent;
        const updates = [];

        // Update each future booking
        for (const booking of futureBookings) {
            const newAmount = booking.amount + rentDifference;

            await base44.entities.PlannedBooking.update(booking.id, {
                amount: newAmount,
                updated_reason: `Auto-updated due to rent change from ${oldRent}€ to ${newRent}€`
            });

            updates.push({
                id: booking.id,
                oldAmount: booking.amount,
                newAmount: newAmount,
                date: booking.booking_date
            });
        }

        console.log(`Updated ${updates.length} bookings for contract ${contractId}`);

        return Response.json({
            success: true,
            updated: updates.length,
            details: updates
        });

    } catch (error) {
        console.error('Error updating bookings:', error.message);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});