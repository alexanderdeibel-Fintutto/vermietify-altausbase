import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { buildingId, unitIndex } = await req.json();

        if (!buildingId || unitIndex === undefined) {
            return Response.json({ error: 'buildingId and unitIndex are required' }, { status: 400 });
        }

        // Get the building
        const buildings = await base44.asServiceRole.entities.Building.filter({ id: buildingId });
        const building = buildings[0];

        if (!building || !building.flaechen_einheiten || !building.flaechen_einheiten[unitIndex]) {
            return Response.json({ error: 'Fläche nicht gefunden' }, { status: 404 });
        }

        // Check dependencies first
        const flaeche = building.flaechen_einheiten[unitIndex];
        const allUnits = await base44.asServiceRole.entities.Unit.filter({ gebaeude_id: buildingId });
        
        const matchingUnit = allUnits.find(u => 
            u.unit_number === flaeche.bezeichnung || 
            (u.floor === flaeche.etage && u.position === flaeche.lage)
        );

        if (matchingUnit) {
            // Check for dependencies
            const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ unit_id: matchingUnit.id });
            const payments = await base44.asServiceRole.entities.Payment.filter({ unit_id: matchingUnit.id });
            const financialItems = await base44.asServiceRole.entities.FinancialItem.filter({ related_to_unit_id: matchingUnit.id });
            const operatingCostItems = await base44.asServiceRole.entities.OperatingCostStatementItem.filter({ unit_id: matchingUnit.id });

            if (contracts.length > 0 || payments.length > 0 || financialItems.length > 0 || operatingCostItems.length > 0) {
                return Response.json({ 
                    error: 'Diese Fläche ist mit anderen Daten verknüpft und kann nicht gelöscht werden',
                    dependencies: {
                        contracts: contracts.length,
                        payments: payments.length,
                        financialItems: financialItems.length,
                        operatingCostItems: operatingCostItems.length
                    }
                }, { status: 400 });
            }
        }

        // Remove the unit from the array
        const updatedFlaechenEinheiten = building.flaechen_einheiten.filter((_, i) => i !== unitIndex);

        // Update the building
        await base44.asServiceRole.entities.Building.update(buildingId, {
            flaechen_einheiten: updatedFlaechenEinheiten
        });

        return Response.json({
            success: true,
            message: 'Fläche erfolgreich gelöscht',
            remainingUnits: updatedFlaechenEinheiten.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});