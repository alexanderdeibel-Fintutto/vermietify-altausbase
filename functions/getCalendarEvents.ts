import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = [
    { id: '1', summary: 'Besichtigung Musterstraße 1', start: new Date().toISOString() },
    { id: '2', summary: 'Wartungstermin', start: new Date(Date.now() + 86400000).toISOString() }
  ];

  return Response.json({ events });
});