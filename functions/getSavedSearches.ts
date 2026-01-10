import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searches = [
    { id: '1', name: 'Alle Berliner Gebäude', query: 'city:Berlin' },
    { id: '2', name: 'Aktive Mieter', query: 'status:active' }
  ];

  return Response.json({ searches });
});