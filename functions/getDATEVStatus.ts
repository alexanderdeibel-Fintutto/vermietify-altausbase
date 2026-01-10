import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    configured: true,
    last_sync: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  });
});