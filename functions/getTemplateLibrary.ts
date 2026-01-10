import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = [
    { id: '1', name: 'Mieterhöhung', description: 'Vorlage für Mieterhöhung', category: 'Mietrecht' },
    { id: '2', name: 'Kündigung', description: 'Kündigungsschreiben', category: 'Mietrecht' },
    { id: '3', name: 'Nebenkostenabrechnung', description: 'Standard-Abrechnung', category: 'Finanzen' }
  ];

  return Response.json({ templates });
});