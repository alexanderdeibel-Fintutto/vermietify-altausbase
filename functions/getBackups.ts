import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const backups = [
    { id: '1', created_date: new Date().toISOString(), size: '245 MB' },
    { id: '2', created_date: new Date(Date.now() - 86400000).toISOString(), size: '238 MB' }
  ];

  return Response.json({ backups });
});