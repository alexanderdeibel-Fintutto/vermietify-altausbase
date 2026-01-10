import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const suggestions = [
    {
      id: '1',
      title: 'Kategorisierung optimieren',
      description: '15 Transaktionen könnten automatisch kategorisiert werden',
      impact: 'Hoch'
    },
    {
      id: '2',
      title: 'Steuervorauszahlung anpassen',
      description: 'Basierend auf aktuellen Einkünften empfohlen',
      impact: 'Mittel'
    }
  ];

  return Response.json({ suggestions });
});