import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id, building_id } = await req.json();

    // Fetch task details
    const tasks = await base44.entities.BuildingTask.filter({ id: task_id }, null, 1);
    const task = tasks[0];

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Fetch all building managers
    const allManagers = await base44.entities.BuildingManager.list(null, 100);
    
    // Filter managers for this building
    const buildingManagers = allManagers.filter(m => 
      m.assigned_buildings?.includes(building_id) && m.is_active
    );

    // Fetch current workload for each manager
    const allTasks = await base44.entities.BuildingTask.filter({
      status: { $in: ['open', 'assigned', 'in_progress'] }
    }, null, 500);

    const workloadByManager = {};
    buildingManagers.forEach(manager => {
      const managerTasks = allTasks.filter(t => t.assigned_to === manager.user_email);
      workloadByManager[manager.user_email] = {
        total_tasks: managerTasks.length,
        urgent_tasks: managerTasks.filter(t => t.priority === 'urgent').length,
        high_priority_tasks: managerTasks.filter(t => t.priority === 'high').length
      };
    });

    // AI analysis for best assignment
    const prompt = `Als Facility Management Experte, analysiere die folgende Aufgabe und schlage den besten Mitarbeiter vor:

AUFGABE:
- Titel: ${task.task_title}
- Typ: ${task.task_type}
- Priorität: ${task.priority}
- Beschreibung: ${task.description}

VERFÜGBARE MITARBEITER:
${buildingManagers.map(m => `
- ${m.full_name} (${m.role})
  Spezialisierungen: ${m.specializations?.join(', ') || 'keine'}
  Aktuelle Auslastung: ${workloadByManager[m.user_email].total_tasks} Aufgaben
  Davon dringend: ${workloadByManager[m.user_email].urgent_tasks}
  Verfügbarkeit: ${m.availability_hours || 'Standard'}
`).join('\n')}

Bewerte jeden Mitarbeiter nach:
1. Fachliche Eignung (passt die Spezialisierung zur Aufgabe?)
2. Aktuelle Auslastung (weniger Aufgaben = besser)
3. Verfügbarkeit
4. Priorität der Aufgabe

Schlage die TOP 3 Mitarbeiter vor mit Begründung und Score (0-100).

Antworte im JSON-Format:
{
  "recommendations": [
    {
      "manager_email": "...",
      "manager_name": "...",
      "score": ...,
      "reason": "..."
    }
  ]
}`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                manager_email: { type: "string" },
                manager_name: { type: "string" },
                score: { type: "number" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      task_id: task_id,
      recommendations: aiResult.recommendations || [],
      workload_summary: workloadByManager
    });

  } catch (error) {
    console.error('Task assignment suggestion error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});