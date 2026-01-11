import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action, building_id, inspection_id, finding_description } = await req.json();
    
    if (action === 'predict_maintenance_needs') {
      const building = await base44.asServiceRole.entities.Building.read(building_id);
      const inspections = await base44.asServiceRole.entities.BuildingInspection.filter({ 
        building_id 
      }, '-inspection_date', 20);
      
      const findings = await base44.asServiceRole.entities.InspectionFinding.filter({ 
        building_id 
      });
      
      const buildingAge = building.year_built ? 
        new Date().getFullYear() - building.year_built : 'Unbekannt';
      
      const findingsSummary = findings
        .map(f => `${f.category} - ${f.severity}: ${f.description}`)
        .slice(0, 30)
        .join('\n');
      
      const prompt = `Analysiere Gebäudedaten und sage Wartungsbedarf vorher:

GEBÄUDE:
Adresse: ${building.address?.street}, ${building.address?.city}
Baujahr: ${building.year_built || 'N/A'} (Alter: ${buildingAge} Jahre)
Typ: ${building.building_type || 'N/A'}
Einheiten: ${building.number_of_units || 'N/A'}

LETZTE INSPEKTIONEN: ${inspections.length}

HISTORISCHE BEFUNDE (letzte 30):
${findingsSummary || 'Keine Befunde'}

Basierend auf Gebäudealter und Inspektionshistorie:
1. Welche Systeme benötigen wahrscheinlich bald Wartung/Austausch?
2. Welche präventiven Maßnahmen empfiehlst du?
3. Geschätzte Kosten und Zeitrahmen?

Antworte mit JSON:
{
  "predicted_maintenance_needs": [
    {
      "system": "...",
      "predicted_timeframe": "...",
      "confidence": "high/medium/low",
      "estimated_cost": "...",
      "reasoning": "..."
    }
  ],
  "preventive_recommendations": ["..."],
  "priority_actions": ["..."]
}`;

      const predictions = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            predicted_maintenance_needs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  system: { type: "string" },
                  predicted_timeframe: { type: "string" },
                  confidence: { type: "string" },
                  estimated_cost: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            preventive_recommendations: {
              type: "array",
              items: { type: "string" }
            },
            priority_actions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      return Response.json({ predictions });
    }
    
    if (action === 'analyze_finding') {
      const prompt = `Analysiere diesen Inspektionsbefund:

Beschreibung: ${finding_description}

Bewerte:
1. Schweregrad (minor, moderate, major, critical)
2. Geschätzte Reparaturkosten
3. Empfohlene Dringlichkeit (sofort, diese Woche, dieser Monat, geplant)
4. Passende Wartungskategorie

Antworte mit JSON:
{
  "severity": "...",
  "estimated_cost": "...",
  "urgency": "...",
  "category": "...",
  "recommended_action": "..."
}`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            severity: { type: "string" },
            estimated_cost: { type: "string" },
            urgency: { type: "string" },
            category: { type: "string" },
            recommended_action: { type: "string" }
          }
        }
      });
      
      return Response.json({ analysis });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});