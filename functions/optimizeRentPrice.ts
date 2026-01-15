import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { unitId, currentRent } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Hole Unit & Building Daten
        const units = await base44.entities.Unit.list();
        const unit = units.find(u => u.id === unitId);
        const buildings = await base44.entities.Building.list();
        const building = buildings.find(b => b.id === unit?.building_id);

        // Hole ähnliche Mietverträge für Vergleich
        const leases = await base44.entities.LeaseContract.list();
        const similarLeases = leases.filter(l => {
            const u = units.find(x => x.id === l.unit_id);
            return u?.building_id === unit?.building_id && l.monthly_rent > 0;
        });

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Analysiere und optimiere die Miete basierend auf Marktdaten:

Einheit: ${unit?.unit_number}
Gebäude: ${building?.name}
Aktuelle Miete: €${currentRent}
Fläche: ${unit?.square_meters}m²
Zimmer: ${unit?.rooms}

Vergleichbare Einheiten im Gebäude:
${similarLeases.map(l => `- €${l.monthly_rent} (${units.find(u => u.id === l.unit_id)?.square_meters}m²)`).join('\n')}

Gib eine Mietoptimierungsempfehlung:
{
  "current_rent": ${currentRent},
  "recommended_rent": 0,
  "market_rate": 0,
  "increase_percentage": 0,
  "confidence": 0.95,
  "reasoning": "Erklärung",
  "market_analysis": "Marktanalyse",
  "recommendations": ["Empfehlung 1", "Empfehlung 2"],
  "legal_considerations": "Rechtliche Grenzen"
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    current_rent: { type: 'number' },
                    recommended_rent: { type: 'number' },
                    market_rate: { type: 'number' },
                    increase_percentage: { type: 'number' },
                    confidence: { type: 'number' },
                    reasoning: { type: 'string' },
                    market_analysis: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    legal_considerations: { type: 'string' }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            optimization: response
        }), { status: 200 });

    } catch (error) {
        console.error('Rent optimization error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});