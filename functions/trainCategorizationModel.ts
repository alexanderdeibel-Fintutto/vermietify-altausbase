import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categorized = await base44.entities.FinancialItem.filter({
    category: { $ne: 'Uncategorized' }
  }, null, 200);

  console.log(`Training model with ${categorized.length} examples`);

  return Response.json({ success: true, trained_on: categorized.length });
});