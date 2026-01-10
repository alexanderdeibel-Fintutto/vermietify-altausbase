import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file_url } = await req.json();

  const extracted = await base44.integrations.Core.InvokeLLM({
    prompt: 'Extrahiere Anbieter, Betrag, Datum und Kategorie aus diesem Beleg',
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        vendor: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string' },
        category: { type: 'string' }
      }
    }
  });

  await base44.entities.FinancialItem.create({
    name: extracted.vendor,
    amount: -Math.abs(extracted.amount),
    category: extracted.category,
    receipt_url: file_url
  });

  return Response.json(extracted);
});