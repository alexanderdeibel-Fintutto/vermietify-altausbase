import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { issue_id } = await req.json();

  if (issue_id === '2') {
    const uncategorized = await base44.entities.FinancialItem.filter(
      { category: 'Uncategorized' },
      null,
      50
    );

    for (const item of uncategorized) {
      await base44.entities.FinancialItem.update(item.id, { category: 'Sonstiges' });
    }
  }

  return Response.json({ success: true, fixed: true });
});