import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { format, data_type } = await req.json();

  const data = await base44.entities.FinancialItem.list(null, 1000);

  let content = '';
  let mime_type = 'text/csv';
  let filename = `export_${Date.now()}.csv`;

  if (format === 'csv') {
    content = 'Name;Betrag;Datum\n' + data.map(d => `${d.name};${d.amount};${d.created_date}`).join('\n');
  } else if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mime_type = 'application/json';
    filename = `export_${Date.now()}.json`;
  }

  return Response.json({ content, mime_type, filename });
});