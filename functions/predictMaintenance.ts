import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { equipment_id, building_id } = await req.json();
    
    const equipment = await base44.asServiceRole.entities.Equipment.read(equipment_id);
    
    // Get maintenance history
    const tasks = await base44.asServiceRole.entities.MaintenanceTask.filter({ 
      equipment_id 
    }, '-created_date', 50);

    const historyData = tasks.map(t => ({
      date: t.created_date,
      type: t.task_type,
      cost: t.cost,
      description: t.description
    }));

    // ML prediction using AI
    const prediction = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere Wartungsdaten und prognostiziere zukünftige Wartungsbedarfe:

Equipment: ${equipment.name} (${equipment.type})
Installationsdatum: ${equipment.installation_date}
Alter: ${Math.floor((Date.now() - new Date(equipment.installation_date)) / (365 * 24 * 60 * 60 * 1000))} Jahre

Wartungshistorie (${tasks.length} Einträge):
${JSON.stringify(historyData, null, 2)}

Aufgabe: Prognostiziere wann das nächste Wartungsereignis wahrscheinlich ist.
Berücksichtige Verschleiß, Wartungszyklen und Ausfallwahrscheinlichkeit.`,
      response_json_schema: {
        type: "object",
        properties: {
          prediction_type: { 
            type: "string",
            enum: ["failure", "maintenance_due", "replacement_needed"]
          },
          predicted_date: { type: "string" },
          probability: { type: "number" },
          estimated_cost: { type: "number" },
          factors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                factor: { type: "string" },
                impact: { type: "number" }
              }
            }
          },
          recommended_action: { type: "string" }
        }
      }
    });

    const maintenancePrediction = await base44.asServiceRole.entities.MaintenancePrediction.create({
      equipment_id,
      building_id,
      company_id: equipment.company_id,
      prediction_type: prediction.prediction_type,
      predicted_date: prediction.predicted_date,
      probability: prediction.probability,
      estimated_cost: prediction.estimated_cost,
      factors: prediction.factors,
      recommended_action: prediction.recommended_action,
      status: 'pending'
    });

    return Response.json({ success: true, prediction: maintenancePrediction });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});