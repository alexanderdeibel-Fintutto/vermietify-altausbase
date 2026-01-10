import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await base44.asServiceRole.entities.User.list(null, 50);

  const members = users.map(u => ({
    id: u.id,
    name: u.full_name,
    role: u.role,
    last_active: 'Heute'
  }));

  return Response.json({ members });
});