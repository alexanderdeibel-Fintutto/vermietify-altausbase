import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const syncs = await base44.entities.FinAPISync.list('-created_date', 1);

  return Response.json({
    auto_sync: true,
    last_sync: syncs[0]?.created_date || null
  });
});