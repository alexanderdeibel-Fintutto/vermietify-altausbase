import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const webhooks = [
    { id: '1', url: 'https://example.com/webhook', events: ['building.created', 'tenant.updated'] }
  ];

  return Response.json({ webhooks });
});