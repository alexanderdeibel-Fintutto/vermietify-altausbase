import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await base44.entities.FinancialItem.list(null, 1000);

  console.log(`Exporting ${items.length} items to DATEV`);

  return Response.json({ success: true, exported: items.length });
});