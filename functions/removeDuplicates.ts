import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ids } = await req.json();

  for (let i = 1; i < ids.length; i++) {
    await base44.entities.FinancialItem.delete(ids[i]);
  }

  return Response.json({ success: true, removed: ids.length - 1 });
});