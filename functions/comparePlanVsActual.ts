import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = [
    { category: 'Mieten', plan: 120000, actual: 118500 },
    { category: 'Wartung', plan: 15000, actual: 18200 },
    { category: 'Verwaltung', plan: 8000, actual: 7800 },
    { category: 'Nebenkosten', plan: 25000, actual: 26100 }
  ];

  return Response.json({ data });
});