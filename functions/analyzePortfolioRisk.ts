import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const factors = [
    { factor: 'Liquidität', value: 85 },
    { factor: 'Diversifikation', value: 65 },
    { factor: 'Marktrisiko', value: 45 },
    { factor: 'Währung', value: 90 },
    { factor: 'Zinsänderung', value: 55 }
  ];

  const recommendations = [
    'Diversifikation in weitere Anlageklassen erhöhen',
    'Liquiditätsreserve aufstocken',
    'Zinsrisiko durch Festzinsvereinbarungen reduzieren'
  ];

  return Response.json({ 
    total_score: 68,
    factors,
    recommendations
  });
});