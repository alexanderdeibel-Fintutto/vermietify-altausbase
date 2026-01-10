import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tenant_id } = await req.json();

  const factors = [
    { name: 'Zahlungsmoral', value: 95 },
    { name: 'Kommunikation', value: 88 },
    { name: 'Pflegezustand', value: 92 },
    { name: 'Mietdauer', value: 78 }
  ];

  const total = Math.round(factors.reduce((sum, f) => sum + f.value, 0) / factors.length);

  return Response.json({
    total,
    factors,
    rating: total > 90 ? 'Exzellent' : total > 75 ? 'Gut' : 'Durchschnittlich',
    recommendation: 'Zuverlässiger Mieter mit hoher Bonität'
  });
});