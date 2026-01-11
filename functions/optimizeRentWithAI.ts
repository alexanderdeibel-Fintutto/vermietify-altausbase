import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { unit_id } = await req.json();
    
    const unit = await base44.asServiceRole.entities.Unit.read(unit_id);
    const building = await base44.asServiceRole.entities.Building.read(unit.building_id);
    
    // Get current rent from active contract
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
      unit_id, 
      status: 'active' 
    });
    const currentRent = contracts[0]?.monthly_rent || unit.monthly_rent || 0;

    // Get market data
    const nearbyUnits = await base44.asServiceRole.entities.Unit.filter({ 
      company_id: unit.company_id 
    });
    const avgRent = nearbyUnits.reduce((sum, u) => sum + (u.monthly_rent || 0), 0) / nearbyUnits.length;

    // AI analysis
    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere die optimale Miete für diese Wohnung:
      
Wohnung:
- Größe: ${unit.size_sqm} m²
- Zimmer: ${unit.rooms}
- Standort: ${building.address?.city || 'Unknown'}
- Aktuelle Miete: ${currentRent}€
- Durchschnitt Gebäude: ${avgRent}€

Aufgabe: Schlage eine optimale Miete vor basierend auf Marktlage, Größe und Ausstattung.
Berücksichtige Mietpreisbremse (max 10% über Mietspiegel) und lokale Marktbedingungen.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_rent: { type: "number" },
          market_factors: {
            type: "object",
            properties: {
              location_score: { type: "number" },
              demand_level: { type: "string" },
              avg_market_rent: { type: "number" },
              vacancy_trend: { type: "string" }
            }
          },
          confidence_score: { type: "number" },
          reasoning: { type: "string" }
        }
      }
    });

    const optimization = await base44.asServiceRole.entities.RentOptimization.create({
      unit_id,
      company_id: unit.company_id,
      current_rent: currentRent,
      suggested_rent: aiAnalysis.suggested_rent,
      market_factors: aiAnalysis.market_factors,
      confidence_score: aiAnalysis.confidence_score,
      reasoning: aiAnalysis.reasoning,
      created_at: new Date().toISOString()
    });

    return Response.json({ success: true, optimization });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});