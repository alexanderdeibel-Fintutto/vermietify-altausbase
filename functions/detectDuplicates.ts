import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await base44.entities.FinancialItem.list(null, 500);
  const duplicates = [];
  const seen = new Map();

  for (const item of items) {
    const key = `${item.name}_${item.amount}`;
    if (seen.has(key)) {
      const group = seen.get(key);
      group.items.push(item);
      group.item_ids.push(item.id);
    } else {
      seen.set(key, { group_id: key, items: [item], item_ids: [item.id] });
    }
  }

  for (const [key, group] of seen.entries()) {
    if (group.items.length > 1) {
      duplicates.push(group);
    }
  }

  return Response.json({ duplicates });
});