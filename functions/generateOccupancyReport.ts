import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { building_id } = await req.json();

        if (!building_id) {
            return Response.json({ error: 'building_id required' }, { status: 400 });
        }

        // Get building
        const buildings = await base44.entities.Building.filter({ id: building_id });
        const building = buildings[0];

        if (!building) {
            return Response.json({ error: 'Building not found' }, { status: 404 });
        }

        // Get units
        const units = await base44.entities.Unit.filter({ gebaeude_id: building_id });

        // Get contracts
        const contracts = await base44.entities.LeaseContract.filter({ unit_id: building_id });

        // Calculate occupancy
        const totalUnits = units.length;
        const occupiedUnits = contracts.filter(c => c.status === 'active').length;
        const vacantUnits = totalUnits - occupiedUnits;
        const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100) : 0;

        // Calculate by unit type/floor
        const unitsByFloor = {};
        units.forEach(unit => {
            const floor = unit.floor || 'unknown';
            if (!unitsByFloor[floor]) {
                unitsByFloor[floor] = { total: 0, occupied: 0 };
            }
            unitsByFloor[floor].total++;
            
            if (contracts.some(c => c.unit_id === unit.id && c.status === 'active')) {
                unitsByFloor[floor].occupied++;
            }
        });

        const floorBreakdown = Object.entries(unitsByFloor).map(([floor, data]) => ({
            floor,
            total_units: data.total,
            occupied_units: data.occupied,
            occupancy_rate: data.total > 0 ? ((data.occupied / data.total) * 100) : 0
        }));

        return Response.json({
            building_id: building.id,
            building_name: building.name,
            occupancy_summary: {
                total_units: totalUnits,
                occupied_units: occupiedUnits,
                vacant_units: vacantUnits,
                occupancy_rate: parseFloat(occupancyRate.toFixed(2))
            },
            floor_breakdown: floorBreakdown,
            city: building.city
        });

    } catch (error) {
        console.error('Generate occupancy report error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});