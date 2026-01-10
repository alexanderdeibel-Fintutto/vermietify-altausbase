import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file_url, import_type } = await req.json();

  const schema = {
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
          date: { type: 'string' }
        }
      }
    },
    buildings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { type: 'string' }
        }
      }
    }
  };

  const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
    file_url,
    json_schema: schema[import_type] || schema.transactions
  });

  if (extracted.status === 'error') {
    return Response.json({ error: extracted.details }, { status: 400 });
  }

  const entityMap = {
    transactions: 'FinancialItem',
    buildings: 'Building'
  };

  const imported = await base44.entities[entityMap[import_type]].bulkCreate(extracted.output);

  return Response.json({ success: true, imported: imported.length });
});