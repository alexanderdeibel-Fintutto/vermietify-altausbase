import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url, events } = await req.json();

  const webhooks = user.webhooks || [];
  webhooks.push({
    id: Date.now().toString(),
    url,
    events,
    active: true
  });

  await base44.auth.updateMe({ webhooks });

  return Response.json({ success: true });
});