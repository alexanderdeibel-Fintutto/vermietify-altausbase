import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { operation, ids } = await req.json();

  switch (operation) {
    case 'categorize':
      for (const id of ids) {
        const item = await base44.entities.FinancialItem.filter({ id });
        const category = await base44.integrations.Core.InvokeLLM({
          prompt: `Kategorisiere diese Transaktion: ${item[0].name}`,
          response_json_schema: {
            type: 'object',
            properties: { category: { type: 'string' } }
          }
        });
        await base44.entities.FinancialItem.update(id, { category: category.category });
      }
      break;
    
    case 'delete':
      for (const id of ids) {
        await base44.entities.FinancialItem.delete(id);
      }
      break;
    
    case 'archive':
      for (const id of ids) {
        await base44.entities.FinancialItem.update(id, { is_archived: true });
      }
      break;
  }

  return Response.json({ success: true, processed: ids.length });
});