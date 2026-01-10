import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backups = [
    { id: '1', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), size: '2.3 MB' },
    { id: '2', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), size: '2.2 MB' },
    { id: '3', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), size: '2.1 MB' }
  ];

  return Response.json({ backups });
});