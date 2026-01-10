import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const optimizations = [
    { id: '1', title: 'AfA-Optimierung', description: 'Wechsel zu linearer AfA spart Steuern', savings: 2400 },
    { id: '2', title: 'Vorsteuerabzug', description: 'Nicht abgerechnete Vorsteuer geltend machen', savings: 1850 },
    { id: '3', title: 'Rückstellung', description: 'Rückstellungen für geplante Renovierung bilden', savings: 3200 }
  ];

  return Response.json({
    potential_savings: 7450,
    optimizations
  });
});