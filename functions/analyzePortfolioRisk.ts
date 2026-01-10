import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const factors = [
    { factor: 'Diversifikation', score: 75 },
    { factor: 'Liquidität', score: 85 },
    { factor: 'Marktrisiko', score: 60 },
    { factor: 'Kreditrisiko', score: 90 },
    { factor: 'Standortrisiko', score: 70 }
  ];

  const avgScore = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
  const level = avgScore > 75 ? 'low' : avgScore > 50 ? 'medium' : 'high';

  return Response.json({ level, factors });
});