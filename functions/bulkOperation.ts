import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { operation, entity_type, data } = await req.json();

  let affected = 0;

  if (operation === 'update') {
    const entities = await base44.entities[entity_type].list(null, 100);
    for (const entity of entities) {
      await base44.entities[entity_type].update(entity.id, data);
      affected++;
    }
  }

  return Response.json({ affected });
});