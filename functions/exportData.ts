import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { entity_type, format } = await req.json();

  const entities = await base44.entities[entity_type].list(null, 1000);

  let content = '';
  let mime_type = 'text/csv';

  if (format === 'csv') {
    const headers = Object.keys(entities[0] || {}).join(',');
    const rows = entities.map(e => Object.values(e).join(',')).join('\n');
    content = `${headers}\n${rows}`;
  } else if (format === 'json') {
    content = JSON.stringify(entities, null, 2);
    mime_type = 'application/json';
  }

  return Response.json({ content, mime_type });
});