import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contract_id } = await req.json();

  const contract = (await base44.entities.LeaseContract.filter({ id: contract_id }))[0];

  const analysis = await base44.integrations.Core.InvokeLLM({
    prompt: `Analysiere diesen Mietvertrag auf rechtliche Risiken: ${contract.contract_text || 'Standardmietvertrag'}`,
    response_json_schema: {
      type: 'object',
      properties: {
        clauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              analysis: { type: 'string' },
              risk: { type: 'string' }
            }
          }
        }
      }
    }
  });

  return Response.json(analysis);
});