import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const financialItems = await base44.entities.FinancialItem.list(null, 500);
  const issues = [];

  const duplicates = financialItems.filter((item, idx, arr) => 
    arr.findIndex(i => i.name === item.name && i.amount === item.amount) !== idx
  );

  if (duplicates.length > 0) {
    issues.push({
      id: '1',
      title: 'Mögliche Duplikate',
      description: `${duplicates.length} potentielle Duplikate gefunden`
    });
  }

  const uncategorized = financialItems.filter(i => !i.category || i.category === 'Uncategorized');
  if (uncategorized.length > 10) {
    issues.push({
      id: '2',
      title: 'Unkategorisierte Transaktionen',
      description: `${uncategorized.length} Transaktionen ohne Kategorie`
    });
  }

  return Response.json({ issues });
});