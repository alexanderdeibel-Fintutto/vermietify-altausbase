import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { source_type, source_id, source_data } = await req.json();

    // Analyze source with AI to extract task information
    const prompt = `Analysiere die folgende ${source_type} und erstelle eine strukturierte Aufgabe:

${JSON.stringify(source_data, null, 2)}

Extrahiere:
1. Aufgabentitel (kurz und präzise)
2. Beschreibung (detailliert)
3. Aufgabentyp: maintenance, inspection, cleaning, repair, administrative, other
4. Priorität (low, medium, high, urgent) basierend auf:
   - Dringlichkeit der Anfrage
   - Sicherheitsrisiken
   - Auswirkungen auf Mieter
   - Zeitkritische Aspekte
5. Geschätzte Fälligkeit (in Tagen ab heute)
6. Empfohlener Zuweisungstyp (building_manager, caretaker, technician, admin)

Antworte im JSON-Format:
{
  "task_title": "...",
  "description": "...",
  "task_type": "...",
  "priority": "...",
  "due_in_days": ...,
  "assigned_role": "..."
}`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          task_title: { type: "string" },
          description: { type: "string" },
          task_type: { type: "string" },
          priority: { type: "string" },
          due_in_days: { type: "number" },
          assigned_role: { type: "string" }
        }
      }
    });

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (aiResult.due_in_days || 7));

    // Create task
    const taskData = {
      building_id: source_data.building_id,
      unit_id: source_data.unit_id,
      task_title: aiResult.task_title,
      description: aiResult.description,
      task_type: aiResult.task_type,
      priority: aiResult.priority,
      status: 'open',
      assigned_role: aiResult.assigned_role,
      due_date: dueDate.toISOString(),
      source_type: source_type,
      source_id: source_id
    };

    const newTask = await base44.asServiceRole.entities.BuildingTask.create(taskData);

    return Response.json({
      success: true,
      task: newTask,
      ai_analysis: aiResult
    });

  } catch (error) {
    console.error('Smart task creation error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});