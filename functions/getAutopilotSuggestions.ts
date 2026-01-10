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
      title: 'Vorsteuerabzug optimieren',
      description: 'Rechnung #1234 kann als Betriebsausgabe geltend gemacht werden',
      savings: 1200
    },
    {
      id: '2',
      title: 'AfA-Satz anpassen',
      description: 'Neue AfA-Regelung für Gebäude anwenden',
      savings: 2400
    }
  ];

  return Response.json({ suggestions });
});