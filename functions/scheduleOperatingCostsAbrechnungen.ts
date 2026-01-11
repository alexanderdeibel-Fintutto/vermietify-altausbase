import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user?.role !== 'admin') {
            return Response.json({ error: 'Admin-Zugriff erforderlich' }, { status: 403 });
        }

        // Hole alle Gebäude
        const buildings = await base44.entities.Building.list();
        const currentYear = new Date().getFullYear() - 1; // Vorjahreszahl
        const processed = [];

        for (const building of buildings) {
            // Prüfe ob Betriebskosten für Vorjahr existieren
            const costs = await base44.entities.OperatingCostStatementItem.filter({
                building_id: building.id,
                cost_year: currentYear
            });

            if (costs.length === 0) continue;

            // Generiere Abrechnung
            const result = await base44.functions.invoke('generateOperatingCostsStatement', {
                buildingId: building.id,
                year: currentYear,
                forceRegenerate: false
            });

            if (result.data?.success) {
                processed.push({
                    buildingId: building.id,
                    buildingName: building.name,
                    documentsGenerated: result.data.documentsGenerated
                });
            }
        }

        return Response.json({
            success: true,
            processedBuildings: processed.length,
            details: processed,
            message: `${processed.length} Betriebskostenabrechnungen generiert`
        });
    } catch (error) {
        console.error('Fehler:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});