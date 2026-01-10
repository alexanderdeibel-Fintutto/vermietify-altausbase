import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { favorite_id } = await req.json();

  const favorites = (user.favorites || []).filter(f => f.id !== favorite_id);
  await base44.auth.updateMe({ favorites });

  return Response.json({ success: true });
});