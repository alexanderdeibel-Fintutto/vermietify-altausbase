import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const metrics = [
    { name: 'API Verfügbarkeit', value: 99 },
    { name: 'Datenbankabfragen', value: 95 },
    { name: 'Speicherplatz', value: 68 },
    { name: 'Antwortzeit', value: 92 }
  ];

  return Response.json({ status: 'healthy', metrics });
});