import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const payload = await req.json();
        const { buildingId } = payload;

        if (!buildingId) {
            return Response.json({ error: 'Building ID is required in the payload.' }, { status: 400 });
        }

        const targetBuilding = await base44.asServiceRole.entities.Building.get(buildingId);

        if (!targetBuilding) {
            return Response.json({ error: `Building with ID ${buildingId} not found.` }, { status: 404 });
        }

        // Fetch all existing Units that belong to the target building
        const existingUnits = await base44.asServiceRole.entities.Unit.filter({ building_id: buildingId });

        const migratedFlaechenEinheiten = targetBuilding.flaechen_einheiten || [];
        const migratedUnitIds = [];

        for (const unit of existingUnits) {
            const newEinheit = {
                art: 'Wohneinheit',
                gebaeude_index: 0,
                etage: unit.floor || 0,
                lage: unit.position || 'mitte',
                bezeichnung: unit.unit_number,
                qm: unit.sqm || 0,
                anzahl_wohnzimmer: unit.rooms || 0,
                bad: unit.bathroom_type ? true : false,
                kueche: unit.has_fitted_kitchen || false,
                keller: unit.has_basement || false,
                sat_tv: true,
                internet: 'glasfaser'
            };
            migratedFlaechenEinheiten.push(newEinheit);
            migratedUnitIds.push(unit.id);
        }

        await base44.asServiceRole.entities.Building.update(buildingId, {
            flaechen_einheiten: migratedFlaechenEinheiten
        });

        return Response.json({ 
            success: true, 
            message: `Successfully migrated ${migratedUnitIds.length} units to building ID ${buildingId}.`,
            migratedUnitIds: migratedUnitIds,
            note: 'Old Unit entities are NOT deleted automatically. Please verify the data first.'
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});