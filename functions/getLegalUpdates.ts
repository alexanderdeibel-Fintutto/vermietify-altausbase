import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updates = [
    {
      title: 'Neue AfA-Sätze 2026',
      description: 'Abschreibungssätze für Gebäude wurden angepasst',
      effective_date: '01.01.2026'
    },
    {
      title: 'Grundsteuer-Reform',
      description: 'Neue Bewertungsmethodik tritt in Kraft',
      effective_date: '01.07.2026'
    }
  ];

  return Response.json({ updates });
});