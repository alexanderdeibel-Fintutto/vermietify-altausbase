import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file_url } = await req.json();

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: 'Extrahiere den Barcode und alle relevanten Daten aus diesem Beleg',
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        barcode: { type: 'string' },
        amount: { type: 'number' },
        vendor: { type: 'string' }
      }
    }
  });

  return Response.json(result);
});