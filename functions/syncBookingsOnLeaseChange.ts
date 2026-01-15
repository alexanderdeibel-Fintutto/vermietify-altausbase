import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    // This function is triggered by an entity automation on 'LeaseContract' updates.
    const base44 = createClientFromRequest(req);
    
    // The payload from the automation trigger contains event details and entity data
    const { event, data: contract, old_data: oldContract } = await req.json();

    // Ensure the function is called by the correct trigger
    if (!event || event.type !== 'update' || event.entity_name !== 'LeaseContract') {
        return new Response(JSON.stringify({ message: "Trigger not supported. This function should be called on LeaseContract update." }), { status: 400 });
    }
    
    // Use asServiceRole for robust operations, as system-level changes are needed
    const serviceClient = base44.asServiceRole;
    const contractId = contract.id;

    // Determine what fields have changed
    const changedFields = Object.keys(contract).filter(key => {
        return JSON.stringify(contract[key]) !== JSON.stringify(oldContract[key]);
    });

    const relevantChanges = changedFields.some(field => ['monthly_rent', 'start_date', 'end_date'].includes(field));
    
    if (!relevantChanges) {
        return new Response(JSON.stringify({ message: "No relevant fields changed, sync not needed." }), { status: 200 });
    }

    const today = new Date().toISOString().split('T')[0];

    try {
        const futureBookings = await serviceClient.entities.PlannedBooking.filter({
            lease_contract_id: contractId,
            booking_date: { $gte: today },
            type: 'SOLL'
        });
        
        let bookingsUpdated = 0;
        let bookingsDeleted = 0;

        // If rent changes, update the amount on all future planned bookings
        if (changedFields.includes('monthly_rent')) {
            for (const booking of futureBookings) {
                await serviceClient.entities.PlannedBooking.update(booking.id, {
                    amount: contract.monthly_rent,
                });
                bookingsUpdated++;
            }
        }

        // If the end date changes, delete any bookings that are now after the new end date
        if (changedFields.includes('end_date') && contract.end_date) {
            const newEndDate = new Date(contract.end_date);
            const bookingsToDelete = futureBookings.filter(
                b => new Date(b.booking_date) > newEndDate
            );
            
            for (const booking of bookingsToDelete) {
                await serviceClient.entities.PlannedBooking.delete(booking.id);
                bookingsDeleted++;
            }
        }
        
        // Log the successful sync action
        await serviceClient.entities.AuditLog.create({
            entity_type: 'LeaseContract',
            entity_id: contractId,
            action: 'UPDATE',
            change_summary: `Bookings synced for contract ${contractId} due to update of: ${changedFields.join(', ')}. Updated: ${bookingsUpdated}, Deleted: ${bookingsDeleted}.`,
            user_email: contract.updated_by || 'system'
        });

        return new Response(JSON.stringify({ success: true, message: `Sync complete. Updated: ${bookingsUpdated}, Deleted: ${bookingsDeleted}.` }), { status: 200 });

    } catch(error) {
        console.error("Error in syncBookingsOnLeaseChange:", error);
        // Log the error
        await serviceClient.entities.AuditLog.create({
            entity_type: 'LeaseContract',
            entity_id: contractId,
            action: 'ERROR',
            change_summary: `Failed to sync bookings for contract ${contractId}. Error: ${error.message}`,
            user_email: contract.updated_by || 'system'
        });
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});