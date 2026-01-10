import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file_url, entity_type } = await req.json();

  const response = await fetch(file_url);
  const text = await response.text();
  
  const rows = text.split('\n').slice(1);
  let imported = 0;

  for (const row of rows) {
    if (!row.trim()) continue;
    const values = row.split(',');
    
    const data = entity_type === 'Building' ? {
      name: values[0],
      address: values[1],
      city: values[2]
    } : {};

    await base44.asServiceRole.entities[entity_type].create(data);
    imported++;
  }

  return Response.json({ imported });
});