import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, assetType } = await req.json();

    try {
        let buildingYear = null;

        // Wenn Gebäude als Asset-Typ: Baujahr aus Building laden
        if (assetType === 'BUILDING' && buildingId) {
            const building = await base44.entities.Building.get(buildingId);
            if (building && building.construction_year) {
                buildingYear = building.construction_year;
            }
        }

        // AfA-Satz nach Typ bestimmen
        let rate = 2.0;
        let duration = 50;
        let reason = 'Standard';

        if (assetType === 'BUILDING' && buildingYear) {
            if (buildingYear < 1925) {
                rate = 2.5;
                duration = 40;
                reason = 'Gebäude vor 1925';
            } else if (buildingYear <= 2022) {
                rate = 2.0;
                duration = 50;
                reason = 'Gebäude 1925-2022';
            } else {
                rate = 3.0;
                duration = 33;
                reason = 'Gebäude ab 2023 (§7 Abs. 4 EStG neu)';
            }
        } else if (assetType === 'RENOVATION') {
            rate = 2.0;
            duration = 50;
            reason = 'Sanierung (wie Gebäude)';
        } else if (assetType === 'EQUIPMENT') {
            rate = 10.0;
            duration = 10;
            reason = 'Technische Anlagen';
        } else if (assetType === 'LAND_IMPROVEMENT') {
            rate = 5.0;
            duration = 20;
            reason = 'Außenanlagen';
        }

        return new Response(JSON.stringify({
            rate,
            duration,
            reason
        }), { status: 200 });

    } catch (error) {
        console.error('Error determining AfA rate:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});