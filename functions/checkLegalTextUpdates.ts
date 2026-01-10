import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updates = [
    {
      id: '1',
      title: 'Widerrufsbelehrung 2026',
      description: 'Neue Formulierung nach BGH-Urteil erforderlich'
    },
    {
      id: '2',
      title: 'Datenschutzerklärung',
      description: 'DSGVO-Anpassung für Mieterportal'
    }
  ];

  return Response.json({ updates });
});