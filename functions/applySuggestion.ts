import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { suggestion_id } = await req.json();

  if (suggestion_id === '1') {
    const uncategorized = await base44.entities.FinancialItem.filter({ category: 'Uncategorized' }, null, 15);
    
    for (const item of uncategorized) {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Kategorisiere diese Transaktion: ${item.name}. Wähle aus: Miete, Nebenkosten, Wartung, Sonstiges`,
        response_json_schema: {
          type: 'object',
          properties: { category: { type: 'string' } }
        }
      });
      await base44.entities.FinancialItem.update(item.id, { category: result.category });
    }
  }

  return Response.json({ success: true });
});