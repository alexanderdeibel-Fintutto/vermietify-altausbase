import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Get all buildings (now "Objekte")
        const buildings = await base44.asServiceRole.entities.Building.list();
        
        // Get all units
        const units = await base44.asServiceRole.entities.Unit.list();
        
        const results = {
            gebaeude_created: 0,
            units_updated: 0,
            errors: []
        };

        // For each building, create a default Gebaeude and migrate units
        for (const building of buildings) {
            try {
                // Check if gebaeude_data exists, if not create default
                let gebaeude_data = building.gebaeude_data;
                
                if (!gebaeude_data || gebaeude_data.length === 0) {
                    gebaeude_data = [{
                        bezeichnung: building.name || 'Hauptgebäude',
                        lage_auf_grundstueck: '',
                        eigene_hausnummer: building.house_number || '',
                        gebaeude_standard: 'mittel'
                    }];
                    
                    // Update building with gebaeude_data
                    await base44.asServiceRole.entities.Building.update(building.id, {
                        gebaeude_data: gebaeude_data
                    });
                }

                // Create Gebaeude entity for each
                for (const geb of gebaeude_data) {
                    const newGebaeude = await base44.asServiceRole.entities.Gebaeude.create({
                        objekt_id: building.id,
                        bezeichnung: geb.bezeichnung,
                        lage_auf_grundstueck: geb.lage_auf_grundstueck || '',
                        eigene_hausnummer: geb.eigene_hausnummer || '',
                        gebaeude_standard: geb.gebaeude_standard || 'mittel'
                    });
                    
                    results.gebaeude_created++;

                    // Update units that belonged to this building (only if it's the first/main Gebaeude)
                    if (gebaeude_data.indexOf(geb) === 0) {
                        const buildingUnits = units.filter(u => u.building_id === building.id);
                        
                        for (const unit of buildingUnits) {
                            await base44.asServiceRole.entities.Unit.update(unit.id, {
                                gebaeude_id: newGebaeude.id,
                                building_id: undefined
                            });
                            results.units_updated++;
                        }
                    }
                }
            } catch (error) {
                results.errors.push({
                    building_id: building.id,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            results: results
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});