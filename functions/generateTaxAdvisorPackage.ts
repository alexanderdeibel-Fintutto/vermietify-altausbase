import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const financialItems = await base44.entities.FinancialItem.list(null, 1000);
  const documents = await base44.entities.Document.list(null, 200);

  const packageData = {
    transactions: financialItems.length,
    documents: documents.length,
    generated_at: new Date().toISOString()
  };

  return Response.json(packageData);
});