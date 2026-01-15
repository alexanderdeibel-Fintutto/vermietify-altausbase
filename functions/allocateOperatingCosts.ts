import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { operatingCostItemId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // OperatingCostItem laden
        const items = await base44.entities.OperatingCostItem.list();
        const item = items.find(i => i.id === operatingCostItemId);
        if (!item) {
            return new Response(JSON.stringify({ error: 'OperatingCostItem not found' }), { status: 404 });
        }

        // Units für Building laden
        const units = await base44.entities.Unit.filter({ building_id: item.building_id });
        if (!units.length) {
            return new Response(JSON.stringify({ error: 'No units found' }), { status: 400 });
        }

        // Leases laden um Mieter zu finden
        const allLeases = await base44.entities.LeaseContract.list();
        const leasesByUnit = {};
        allLeases.forEach(lease => {
            if (!leasesByUnit[lease.unit_id]) leasesByUnit[lease.unit_id] = [];
            leasesByUnit[lease.unit_id].push(lease);
        });

        // Allocations berechnen
        const allocations = [];
        let totalAllocated = 0;

        if (item.allocation_method === 'EQUAL') {
            // Gleich auf alle Units verteilen
            const amountPerUnit = item.amount / units.length;
            units.forEach(unit => {
                const lease = leasesByUnit[unit.id]?.[0];
                const allocation = {
                    operating_cost_item_id: operatingCostItemId,
                    unit_id: unit.id,
                    tenant_email: lease?.tenant_email || '',
                    amount: parseFloat(amountPerUnit.toFixed(2)),
                    allocation_percentage: parseFloat((100 / units.length).toFixed(2)),
                    allocation_basis: `Gleichteilung (1/${units.length})`
                };
                allocations.push(allocation);
                totalAllocated += allocation.amount;
            });
        } else if (item.allocation_method === 'PER_UNIT') {
            // Nach Wohnfläche verteilen
            const totalArea = units.reduce((sum, u) => sum + (u.living_area || 0), 0);
            units.forEach(unit => {
                const lease = leasesByUnit[unit.id]?.[0];
                const percentage = totalArea > 0 ? (unit.living_area || 0) / totalArea : 0;
                const amount = item.amount * percentage;
                const allocation = {
                    operating_cost_item_id: operatingCostItemId,
                    unit_id: unit.id,
                    tenant_email: lease?.tenant_email || '',
                    amount: parseFloat(amount.toFixed(2)),
                    allocation_percentage: parseFloat((percentage * 100).toFixed(2)),
                    allocation_basis: `Wohnfläche: ${unit.living_area || 0} qm`
                };
                allocations.push(allocation);
                totalAllocated += allocation.amount;
            });
        } else if (item.allocation_method === 'BY_METER') {
            // Nach Meterstand verteilen (z.B. Wasser, Heizung)
            // Vereinfachte Implementierung – würde Meter-Daten benötigen
            const amountPerUnit = item.amount / units.length;
            units.forEach(unit => {
                const lease = leasesByUnit[unit.id]?.[0];
                const allocation = {
                    operating_cost_item_id: operatingCostItemId,
                    unit_id: unit.id,
                    tenant_email: lease?.tenant_email || '',
                    amount: parseFloat(amountPerUnit.toFixed(2)),
                    allocation_percentage: parseFloat((100 / units.length).toFixed(2)),
                    allocation_basis: `Meterstand-Verhältnis`
                };
                allocations.push(allocation);
                totalAllocated += allocation.amount;
            });
        }

        // Allocations speichern
        const savedAllocations = await Promise.all(
            allocations.map(a => base44.entities.OperatingCostAllocation.create(a))
        );

        // OperatingCostItem auf ALLOCATED setzen
        await base44.entities.OperatingCostItem.update(operatingCostItemId, {
            status: 'ALLOCATED'
        });

        return new Response(JSON.stringify({
            success: true,
            itemId: operatingCostItemId,
            allocationsCount: savedAllocations.length,
            totalAllocated: parseFloat(totalAllocated.toFixed(2)),
            allocations: savedAllocations
        }), { status: 200 });

    } catch (error) {
        console.error('Error allocating costs:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});