import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = [
    { id: '1', name: 'Mietvertrag Standard', category: 'Verträge' },
    { id: '2', name: 'Mieterhöhung', category: 'Schreiben' },
    { id: '3', name: 'Nebenkostenabrechnung', category: 'Abrechnungen' },
    { id: '4', name: 'Kündigung', category: 'Schreiben' }
  ];

  return Response.json({ templates });
});