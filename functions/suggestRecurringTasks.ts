import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id } = await req.json();

    // Fetch building and related data
    const buildings = await base44.entities.Building.filter({ id: building_id }, null, 1);
    const building = buildings[0];

    if (!building) {
      return Response.json({ error: 'Building not found' }, { status: 404 });
    }

    // Fetch historical tasks for this building
    const historicalTasks = await base44.entities.BuildingTask.filter(
      { building_id: building_id },
      '-created_date',
      100
    );

    // Fetch units for this building
    const units = await base44.entities.Unit.filter(
      { building_id: building_id },
      null,
      50
    );

    // Fetch equipment for this building
    const equipment = await base44.entities.Equipment.filter(
      { building_id: building_id },
      null,
      50
    );

    // AI analysis for recurring task suggestions
    const prompt = `Als Facility Management Experte, analysiere folgende Gebäudedaten und schlage wiederkehrende Wartungsaufgaben vor:

Gebäude:
- Name: ${building.name}
- Baujahr: ${building.baujahr || 'unbekannt'}
- Anzahl Einheiten: ${units.length}
- Anzahl Geräte: ${equipment.length}

Bisherige Aufgaben (letzte 100):
${JSON.stringify(historicalTasks.map(t => ({ type: t.task_type, title: t.task_title })), null, 2)}

Geräte im Gebäude:
${JSON.stringify(equipment.map(e => ({ type: e.equipment_type, name: e.name })), null, 2)}

Schlage 5-10 wiederkehrende Wartungsaufgaben vor mit:
1. Titel
2. Beschreibung
3. Aufgabentyp (maintenance, inspection, cleaning)
4. Empfohlene Frequenz (monthly, quarterly, semi-annual, annual)
5. Priorität (low, medium, high)
6. Grund/Begründung

Berücksichtige:
- Gesetzliche Vorschriften (z.B. Heizungswartung jährlich)
- Typische Gebäudeinstandhaltung
- Gerätewartung
- Sicherheitsinspektionen
- Historische Muster

Antworte im JSON-Format:
{
  "suggestions": [
    {
      "title": "...",
      "description": "...",
      "task_type": "...",
      "frequency": "...",
      "priority": "...",
      "reason": "..."
    }
  ]
}`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                task_type: { type: "string" },
                frequency: { type: "string" },
                priority: { type: "string" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      building: {
        id: building.id,
        name: building.name
      },
      suggestions: aiResult.suggestions || []
    });

  } catch (error) {
    console.error('Recurring task suggestion error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});