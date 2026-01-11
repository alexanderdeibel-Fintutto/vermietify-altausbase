import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { handoverProtocolId, tenantId, newAddress } = await req.json();

        console.log(`Updating tenant ${tenantId} address history after handover ${handoverProtocolId}`);

        // 1. Load tenant and handover protocol
        const tenant = await base44.entities.Tenant.read(tenantId);
        const protocol = await base44.entities.HandoverProtocol.read(handoverProtocolId);

        // 2. Get current address history
        const addressHistory = tenant.address_history || [];

        // 3. Mark all current addresses as no longer current
        const updatedHistory = addressHistory.map(addr => ({
            ...addr,
            is_current: false,
            valid_until: addr.is_current ? protocol.protocol_date : addr.valid_until
        }));

        // 4. Add new address based on protocol type
        if (protocol.protocol_type === 'move_in') {
            // When moving in, the unit address becomes the current address
            const unit = await base44.entities.Unit.read(protocol.unit_id);
            const building = await base44.entities.Building.read(unit.gebaeude_id);

            updatedHistory.push({
                address_type: 'current',
                street: building.address,
                house_number: building.house_number,
                postal_code: building.postal_code,
                city: building.city,
                country: 'Deutschland',
                valid_from: protocol.protocol_date,
                is_current: true,
                notes: `Einzug in Wohnung ${unit.unit_number}`
            });
        } else if (protocol.protocol_type === 'move_out' && newAddress) {
            // When moving out, add the new address as future/current
            updatedHistory.push({
                address_type: 'current',
                street: newAddress.street,
                house_number: newAddress.house_number,
                postal_code: newAddress.postal_code,
                city: newAddress.city,
                country: newAddress.country || 'Deutschland',
                valid_from: protocol.protocol_date,
                is_current: true,
                notes: newAddress.notes || 'Nach Auszug'
            });
        }

        // 5. Update tenant with new address history
        await base44.entities.Tenant.update(tenantId, {
            address_history: updatedHistory
        });

        return Response.json({
            success: true,
            message: 'Adresshistorie aktualisiert',
            addressHistory: updatedHistory
        });

    } catch (error) {
        console.error('Error updating tenant address:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});