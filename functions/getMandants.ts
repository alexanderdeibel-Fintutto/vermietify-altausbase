import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mandants = [
    { id: '1', name: 'Hausverwaltung Nord GmbH', buildings_count: 12 },
    { id: '2', name: 'Immobilien Süd AG', buildings_count: 8 }
  ];

  return Response.json({ mandants });
});