import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = [
    { category: 'Mieteinnahmen', planned: 120000, actual: 125000 },
    { category: 'Nebenkosten', planned: 35000, actual: 33500 },
    { category: 'Instandhaltung', planned: 25000, actual: 28000 },
    { category: 'Verwaltung', planned: 18000, actual: 17200 }
  ];

  return Response.json({
    data,
    variance: 2.5,
    achievement: 103
  });
});