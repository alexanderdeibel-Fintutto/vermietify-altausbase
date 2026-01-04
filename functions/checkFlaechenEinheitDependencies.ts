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

        const flaeche = building.flaechen_einheiten[unitIndex];

        // Check for dependencies by searching for old Unit entities that might match this flaeche
        // This is a workaround since flaechen_einheiten don't have their own IDs yet
        const allUnits = await base44.asServiceRole.entities.Unit.filter({ gebaeude_id: buildingId });
        
        const dependencies = {
            contracts: [],
            payments: [],
            financialItems: [],
            operatingCostItems: [],
            canDelete: true,
            warnings: []
        };

        // Try to find matching old Unit by properties
        const matchingUnit = allUnits.find(u => 
            u.unit_number === flaeche.bezeichnung || 
            (u.floor === flaeche.etage && u.position === flaeche.lage)
        );

        if (matchingUnit) {
            // Check LeaseContracts
            const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ unit_id: matchingUnit.id });
            if (contracts.length > 0) {
                dependencies.contracts = contracts;
                dependencies.canDelete = false;
            }

            // Check Payments
            const payments = await base44.asServiceRole.entities.Payment.filter({ unit_id: matchingUnit.id });
            if (payments.length > 0) {
                dependencies.payments = payments;
                dependencies.canDelete = false;
            }

            // Check FinancialItems
            const financialItems = await base44.asServiceRole.entities.FinancialItem.filter({ related_to_unit_id: matchingUnit.id });
            if (financialItems.length > 0) {
                dependencies.financialItems = financialItems;
                dependencies.canDelete = false;
            }

            // Check OperatingCostStatementItems
            const operatingCostItems = await base44.asServiceRole.entities.OperatingCostStatementItem.filter({ unit_id: matchingUnit.id });
            if (operatingCostItems.length > 0) {
                dependencies.operatingCostItems = operatingCostItems;
                dependencies.canDelete = false;
            }
        }

        // Additional warning if this is the only unit in the building
        if (building.flaechen_einheiten.length === 1) {
            dependencies.warnings.push('Dies ist die letzte Fläche in diesem Gebäude');
        }

        return Response.json({
            success: true,
            flaeche: flaeche,
            dependencies: dependencies,
            message: dependencies.canDelete ? 
                'Diese Fläche kann gelöscht werden' : 
                'Diese Fläche ist mit anderen Daten verknüpft und kann nicht gelöscht werden'
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});