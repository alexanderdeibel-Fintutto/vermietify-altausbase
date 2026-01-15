import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const maintenanceTasks = await base44.entities.MaintenanceTask.list();
        const units = await base44.entities.Unit.filter({ building_id: buildingId });
        const buildingTasks = maintenanceTasks.filter(t => units.some(u => u.id === t.unit_id));

        const open = buildingTasks.filter(t => t.status === 'open').length;
        const completed = buildingTasks.filter(t => t.status === 'completed').length;
        const totalCost = buildingTasks.reduce((sum, t) => sum + (t.estimated_cost || 0), 0);

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Analysiere den Wartungszustand:

Gebäude: ${buildingId}
Gesamtaufgaben: ${buildingTasks.length}
Offene Aufgaben: ${open}
Abgeschlossene Aufgaben: ${completed}
Geschätzte Kosten: €${totalCost.toFixed(2)}

{
  "status_overview": {
    "total_tasks": ${buildingTasks.length},
    "open": ${open},
    "completed": ${completed},
    "completion_rate": 0
  },
  "priority_distribution": [
    {"priority": "HIGH|MEDIUM|LOW", "count": 0, "percentage": 0}
  ],
  "cost_analysis": {
    "total_estimated": ${totalCost},
    "completed_cost": 0,
    "pending_cost": 0
  },
  "recommendations": ["Empfehlung 1"],
  "urgent_actions": ["Aktion 1"],
  "maintenance_schedule": ["Plan 1"]
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    status_overview: { type: 'object', additionalProperties: true },
                    priority_distribution: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    cost_analysis: { type: 'object', additionalProperties: true },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    urgent_actions: { type: 'array', items: { type: 'string' } },
                    maintenance_schedule: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            report: response
        }), { status: 200 });

    } catch (error) {
        console.error('Maintenance report error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});