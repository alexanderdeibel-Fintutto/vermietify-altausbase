import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entity_type, entity_id, task_title, task_description, due_date } = body;

    const task = await base44.entities.Task.create({
      title: task_title,
      description: task_description || null,
      due_date: due_date || null,
      status: 'pending',
      priority: 'normal',
      related_entity: entity_type,
      related_entity_id: entity_id,
      assigned_to: user.email
    });

    return Response.json({ success: true, task });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});