import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = [
    { id: '1', name: 'Gebäude-Übersicht', page: 'Buildings' },
    { id: '2', name: 'Finanz-Dashboard', page: 'FinancialItems' }
  ];

  return Response.json({ favorites });
});