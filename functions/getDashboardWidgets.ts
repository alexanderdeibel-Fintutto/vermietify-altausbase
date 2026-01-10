import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const widgets = [
    { id: '1', name: 'Vermögensübersicht', type: 'wealth', enabled: true },
    { id: '2', name: 'Steuer-Dashboard', type: 'tax', enabled: true },
    { id: '3', name: 'Immobilien', type: 'buildings', enabled: true },
    { id: '4', name: 'Transaktionen', type: 'transactions', enabled: false }
  ];

  return Response.json({ widgets });
});