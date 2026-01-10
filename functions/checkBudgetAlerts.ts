import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alerts = [
    { id: '1', category: 'Wartung & Instandhaltung', message: 'Budget zu 85% ausgeschöpft', percentage: 85, amount: 8500 },
    { id: '2', category: 'Verwaltungskosten', message: 'Budget überschritten', percentage: 112, amount: 5600 }
  ];

  return Response.json({ alerts });
});