import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, entity_type, entity_id, due_date, priority } = body;

    const task = await base44.entities.Task.create({
      titel: title,
      beschreibung: description,
      quelle_typ: entity_type,
      quelle_id: entity_id,
      faelligkeitsdatum: due_date,
      prioritaet: priority || 'Mittel',
      status: 'Offen',
      kategorie: 'Verwaltung'
    });

    return Response.json({ success: true, task });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});