import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alerts = [
    { id: '1', category: 'Wartung', budget: 5000, actual: 6200, percentage: 124 },
    { id: '2', category: 'Nebenkosten', budget: 3000, actual: 3450, percentage: 115 }
  ];

  return Response.json({ alerts });
});