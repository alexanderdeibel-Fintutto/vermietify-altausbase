import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return Response.json({ error: 'Items array required' }, { status: 400 });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    for (const item of items) {
      try {
        await base44.entities.FinancialItem.create({
          date: item.date,
          amount: item.amount,
          description: item.description,
          type: item.amount > 0 ? 'income' : 'expense',
          category: item.category,
          supplier: item.supplier,
          document_url: item.document_url,
          created_by: user.email
        });
        results.created++;
      } catch (error) {
        results.errors.push(`${item.description}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      message: `${results.created} Buchungen erstellt`,
      ...results
    });

  } catch (error) {
    console.error('Bulk Create Financial Items Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});