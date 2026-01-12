import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Preview: Shows impact of rent change on future bookings
 * Called BEFORE contract update to show user what will change
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { contractId, newRent, changeDate } = await req.json();

        if (!contractId || newRent === undefined) {
            return Response.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Get current contract
        const contracts = await base44.entities.LeaseContract.list('-updated_date', 1, { id: contractId });
        if (!contracts?.length) {
            return Response.json({ error: 'Contract not found' }, { status: 404 });
        }

        const contract = contracts[0];
        const currentRent = contract.rent_amount || 0;
        const changeDateObj = new Date(changeDate || new Date());

        // Find future bookings
        const futureBookings = await base44.entities.PlannedBooking.list(
            'booking_date',
            1000,
            {
                lease_contract_id: contractId,
                booking_date: { $gte: changeDateObj.toISOString().split('T')[0] },
                booking_type: 'SOLL'
            }
        );

        const rentDifference = newRent - currentRent;
        const totalImpact = rentDifference * (futureBookings?.length || 0);

        return Response.json({
            contractId,
            currentRent,
            newRent,
            rentDifference,
            affectedBookings: futureBookings?.length || 0,
            totalMonthlyImpact: rentDifference,
            totalAnnualImpact: rentDifference * 12,
            changeDate: changeDateObj.toISOString().split('T')[0],
            preview: {
                currentMonthlyExpense: currentRent,
                newMonthlyExpense: newRent,
                monthlyChange: rentDifference,
                affectingBookingsCount: futureBookings?.length || 0
            }
        });

    } catch (error) {
        console.error('Error calculating impact:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});