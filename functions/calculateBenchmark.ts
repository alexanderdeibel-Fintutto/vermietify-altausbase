import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const investments = await base44.entities.Investment.list(null, 100);
  const buildings = await base44.entities.Building.list(null, 100);

  const totalValue = investments.reduce((sum, i) => sum + (i.current_value || 0), 0);
  const avgReturn = 7.5; // Market average
  const userReturn = investments.reduce((sum, i) => sum + (i.return_rate || 0), 0) / investments.length;

  const metrics = [
    {
      name: 'Portfolio-Rendite',
      percentile: Math.min(95, (userReturn / avgReturn) * 50 + 50),
      performance: ((userReturn - avgReturn) / avgReturn * 100).toFixed(1)
    },
    {
      name: 'Diversifikation',
      percentile: Math.min(100, investments.length * 10),
      performance: investments.length > 5 ? 15 : -10
    },
    {
      name: 'Immobilien-Quote',
      percentile: buildings.length > 2 ? 75 : 40,
      performance: buildings.length > 2 ? 12 : -5
    }
  ];

  return Response.json({ metrics });
});