import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId1, buildingId2 } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Sammle Daten für beide Gebäude
        const buildings = await base44.entities.Building.list();
        const units = await base44.entities.Unit.list();
        const leases = await base44.entities.LeaseContract.list();

        const building1 = buildings.find(b => b.id === buildingId1);
        const building2 = buildings.find(b => b.id === buildingId2);

        const units1 = units.filter(u => u.building_id === buildingId1);
        const units2 = units.filter(u => u.building_id === buildingId2);

        const leases1 = leases.filter(l => units1.some(u => u.id === l.unit_id));
        const leases2 = leases.filter(l => units2.some(u => u.id === l.unit_id));

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Vergleiche diese beiden Immobilien:

Gebäude 1: ${building1?.name}
- Einheiten: ${units1.length}
- Belegung: ${(leases1.length / units1.length * 100).toFixed(0)}%
- Durchschnittsmiete: €${(leases1.reduce((sum, l) => sum + l.monthly_rent, 0) / leases1.length || 0).toFixed(2)}

Gebäude 2: ${building2?.name}
- Einheiten: ${units2.length}
- Belegung: ${(leases2.length / units2.length * 100).toFixed(0)}%
- Durchschnittsmiete: €${(leases2.reduce((sum, l) => sum + l.monthly_rent, 0) / leases2.length || 0).toFixed(2)}

Erstelle einen detaillierten Vergleichsbericht:
{
  "comparison": [
    {"metric": "Metrik", "building_1": "Wert", "building_2": "Wert", "winner": "Name", "analysis": "Text"}
  ],
  "strengths": {
    "building_1": ["Stärke 1"],
    "building_2": ["Stärke 1"]
  },
  "weaknesses": {
    "building_1": ["Schwäche 1"],
    "building_2": ["Schwäche 1"]
  },
  "insights": ["Einsicht 1"],
  "recommendations": {
    "building_1": ["Empfehlung"],
    "building_2": ["Empfehlung"]
  }
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    comparison: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    strengths: { type: 'object', additionalProperties: { type: 'array' } },
                    weaknesses: { type: 'object', additionalProperties: { type: 'array' } },
                    insights: { type: 'array', items: { type: 'string' } },
                    recommendations: { type: 'object', additionalProperties: { type: 'array' } }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            building_1: building1?.name,
            building_2: building2?.name,
            report: response
        }), { status: 200 });

    } catch (error) {
        console.error('Comparison error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});