import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { limit = 50 } = await req.json();

  const uncategorized = await base44.entities.FinancialItem.filter(
    { category: { $exists: false } },
    '-date',
    limit
  );

  let categorized = 0;

  for (const item of uncategorized) {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Kategorisiere diese Finanztransaktion: "${item.description}". Wähle die passendste Steuerkategorie aus: Büromaterial, Reisekosten, Bewirtung, Versicherungen, Zinsen, Miete, Instandhaltung, Marketing, Sonstiges`,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          tax_deductible: { type: 'boolean' }
        }
      }
    });

    await base44.entities.FinancialItem.update(item.id, {
      category: result.category,
      is_tax_relevant: result.tax_deductible
    });

    categorized++;
  }

  return Response.json({ categorized, total: uncategorized.length });
});