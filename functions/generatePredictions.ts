import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const insights = [
    {
      type: 'positive',
      title: 'Mieteinnahmen steigen',
      description: 'Basierend auf aktuellen Trends werden Ihre Mieteinnahmen in Q2 um 8% steigen',
      confidence: 82
    },
    {
      type: 'warning',
      title: 'Wartungskosten erhöht',
      description: 'Gebäude A benötigt voraussichtlich erhöhte Wartung (+15%)',
      confidence: 75
    }
  ];

  return Response.json({ insights });
});